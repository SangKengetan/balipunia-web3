const pool = require("../db/pool");
const votingService = require("./voting.service");
const { uploadToIPFS, uploadJSONToIPFS } = require("./ipfsService");

/**
 * CREATE WITHDRAW REQUEST (UNIFIED: CRYPTO + FIAT)
 * Melakukan validasi campaign, insert DB, dan menyiapkan data untuk voting.
 * amount_snapshot disimpan sebagai JSON yang memuat rincian crypto, fiat, fee.
 */

async function createWithdrawRequest({
  adminPuraId,
  campaignId,
  payload,
  file,
}) {
    const {
      reason,
      crypto_usdt = "0",
      crypto_usdc = "0",
      crypto_fee_idr = 0,
      fiat_amount_idr = "0",
      fiat_fee_idr = 0,
      total_idr = "0",
      proposal_id = null,
      locked_rate_usdt_idr = 0,
      locked_rate_usdc_idr = 0,
      locked_rate_at = null,
    } = payload;

  /* =====================================================
     0. Ambil Wallet Admin Pura
  ===================================================== */
  const { rows: adminRows } = await pool.query(
    `
    SELECT wallet_address
    FROM admin_pura
    WHERE id = $1
    LIMIT 1
    `,
    [adminPuraId]
  );

  if (!adminRows.length || !adminRows[0].wallet_address) {
    throw new Error("ADMIN_WALLET_NOT_FOUND");
  }

  const walletAddress = adminRows[0].wallet_address;

  /* =====================================================
     1. Ambil Campaign & Ownership
  ===================================================== */
  const { rows: campaignRows } = await pool.query(
    `
    SELECT *
    FROM campaigns
    WHERE id = $1
      AND admin_pura_id = $2
    LIMIT 1
    `,
    [campaignId, adminPuraId]
  );

  if (!campaignRows.length) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const campaign = campaignRows[0];

  /* =====================================================
     2. Validasi — Semua campaign harus terdaftar on-chain
  ===================================================== */
  if (!campaign.id_campaign_onchain) {
    throw new Error("CAMPAIGN_NOT_REGISTERED_ONCHAIN");
  }

  /* =====================================================
     3. Validasi Deadline (jika ada)
  ===================================================== */
  if (campaign.deadline) {
    const now = new Date();
    const deadline = new Date(campaign.deadline);

    if (now < deadline) {
      throw new Error("CAMPAIGN_NOT_FINISHED");
    }
  }

  /* =====================================================
     4. Cegah Double Withdraw / Cegah Withdraw jika sudah selesai
  ===================================================== */
  const activeStatuses = [
    "REQUESTED",
    "VOTING_IN_PROGRESS",
    "PENDING_TRANSFER",
    "WITHDRAWN",
    "COMPLETED"
  ];
  if (activeStatuses.includes(campaign.status)) {
    throw new Error("WITHDRAW_ALREADY_REQUESTED");
  }

  /* =====================================================
     5. Validasi Dokumen
  ===================================================== */
  if (!file) {
    throw new Error("DOCUMENT_REQUIRED");
  }

  const ipfsCid = await uploadToIPFS(file);

  /* =====================================================
     6. Bangun amount_snapshot JSON
  ===================================================== */
  const amountSnapshot = JSON.stringify({
    crypto: {
      amount_usdt: crypto_usdt,
      amount_usdc: crypto_usdc,
      fee_idr: Number(crypto_fee_idr),
    },
    fiat: {
      amount_idr: fiat_amount_idr,
      fee_idr: Number(fiat_fee_idr),
    },
    total_idr: total_idr,
    locked_rate: {
      usdt_idr: Number(locked_rate_usdt_idr) || 0,
      usdc_idr: Number(locked_rate_usdc_idr) || 0,
      locked_at: locked_rate_at || new Date().toISOString(),
      source: "coingecko",
    },
  });

  /* =====================================================
     7. Insert Withdraw Request
  ===================================================== */
    const initialStatus = proposal_id ? 'VOTING_IN_PROGRESS' : 'REQUESTED';

    const { rows: wdRows } = await pool.query(
      `
      INSERT INTO withdraw_requests (
        admin_pura_id,
        campaign_id,
        onchain_campaign_id,
        campaign_title,
        withdraw_type,
        amount_snapshot,
        total_idr,
        wallet_address,
        reason,
        ipfs_cid,
        governance_proposal_id,
        status
      ) VALUES (
        $1, $2, $3, $4,
        'UNIFIED',
        $5, $6, $7, $8, $9,
        $10, $11
      )
      RETURNING *
      `,
      [
        adminPuraId,
        campaign.id,
        campaign.id_campaign_onchain,
        campaign.title,
        amountSnapshot,
        total_idr,
        walletAddress,
        reason,
        ipfsCid,
        proposal_id,
        initialStatus
      ]
    );

  const withdrawRequest = wdRows[0];

  /* =====================================================
     8. Update Campaign Status
  ===================================================== */
  await pool.query(
    `
    UPDATE campaigns
    SET status = 'REQUEST WITHDRAW',
        updated_at = NOW()
    WHERE id = $1
    `,
    [campaign.id]
  );

  /* =====================================================
     9. Return
  ===================================================== */
  return {
    withdrawRequestId: withdrawRequest.id,
    campaignId: campaign.id,
    onchainCampaignId: campaign.id_campaign_onchain,
    walletAddress,
    ipfsCid,
    status: withdrawRequest.status,
    amountSnapshot: JSON.parse(amountSnapshot),
  };
}




/**
 * UPDATE STATUS AFTER EXECUTION (CALLABLE BY CRON / ADMIN)
 */
async function markWithdrawExecuted({ proposalId, txHash }) {
  await pool.query(
    `
    UPDATE withdraw_requests
    SET status = 'EXECUTED',
        executed_tx_hash = $1,
        updated_at = NOW()
    WHERE governance_proposal_id = $2
    `,
    [txHash, proposalId]
  );
}

/**
 * LIST WITHDRAW REQUESTS BY ADMIN PURA
 */
async function getWithdrawRequestsByAdmin(adminPuraId) {
  const { rows } = await pool.query(
    `
  SELECT
      wr.id,
      wr.campaign_id,
      wr.onchain_campaign_id,
      wr.campaign_title,
      wr.amount_snapshot,
      wr.total_idr,
      wr.status,
      wr.created_at,
      wr.governance_proposal_id,
      wr.executed_tx_hash,
      wr.transfer_proof_cid,
      c.title AS campaign_title_db,
      c.campaign_type
    FROM withdraw_requests wr
    LEFT JOIN campaigns c ON c.id = wr.campaign_id
    WHERE wr.admin_pura_id = $1
    ORDER BY wr.created_at DESC
    `,
    [adminPuraId]
  );

  // Enrich dengan status voting dari Blockchain/Service lain
  const enriched = await Promise.all(
    rows.map(async (wr) => {
      // Default null jika tidak ada proposal ID
      if (!wr.governance_proposal_id) {
        return { ...wr, voting: null };
      }

      try {
        const proposal = await votingService.getProposal(
          wr.governance_proposal_id
        );

        return {
          ...wr,
          voting: {
            proposalId: proposal.proposalId,
            yesVotes: proposal.yesVotes,
            noVotes: proposal.noVotes,
            votesCount: proposal.votesCount,
            status: proposal.status,
            executed: proposal.executed,
          },
        };
      } catch (err) {
        console.error(`Failed to fetch proposal ${wr.governance_proposal_id}`, err);
        return { ...wr, voting: null }; // Fallback jika service error
      }
    })
  );

  return enriched;
}

/**
 * CREATE UNIFIED WITHDRAW REPORT (UPACARA ADAT)
 * Combined flow: creates withdrawal request + LPJ report in one go.
 */
async function createUnifiedWithdrawReport({
  adminPuraId,
  campaignId,
  payload,
  files,
}) {
  const {
    reason,
    crypto_usdt = "0",
    crypto_usdc = "0",
    crypto_fee_idr = 0,
    fiat_amount_idr = "0",
    fiat_fee_idr = 0,
    total_idr = "0",
    proposal_id = null,
    locked_rate_usdt_idr = 0,
    locked_rate_usdc_idr = 0,
    locked_rate_at = null,
    
    // LPJ fields
    description,
    totalIncome,
    incomeSystem,
    incomeOutside,
    incomePeturunan,
    totalExpense
  } = payload;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 0. Ambil Wallet
    const { rows: adminRows } = await client.query(
      `SELECT wallet_address FROM admin_pura WHERE id = $1 LIMIT 1`,
      [adminPuraId]
    );
    if (!adminRows.length || !adminRows[0].wallet_address) {
      throw new Error("ADMIN_WALLET_NOT_FOUND");
    }
    const walletAddress = adminRows[0].wallet_address;

    // 1. Ambil Campaign
    const { rows: campaignRows } = await client.query(
      `SELECT * FROM campaigns WHERE id = $1 AND admin_pura_id = $2 LIMIT 1`,
      [campaignId, adminPuraId]
    );
    if (!campaignRows.length) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }
    const campaign = campaignRows[0];
    if (!campaign.id_campaign_onchain) {
      throw new Error("CAMPAIGN_NOT_REGISTERED_ONCHAIN");
    }

    const activeStatuses = ["REQUESTED", "VOTING_IN_PROGRESS", "PENDING_TRANSFER"];
    if (activeStatuses.includes(campaign.status)) {
      throw new Error("WITHDRAW_ALREADY_REQUESTED");
    }

    if (!files || files.length === 0) {
      throw new Error("DOCUMENT_REQUIRED");
    }

    // 2. IPFS LPJ (Metadata)
    const mediaFiles = [];
    const uploadPromises = files.map(async (f) => {
      const cid = await uploadToIPFS(f);
      return { cid, file_name: f.originalname, mime_type: f.mimetype };
    });
    const results = await Promise.all(uploadPromises);
    mediaFiles.push(...results);

    const metadataJson = {
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      description: description || reason || "",
      total_income: parseFloat(totalIncome) || 0,
      income_details: {
        system: parseFloat(incomeSystem) || 0,
        outside: parseFloat(incomeOutside) || 0,
        peturunan: parseFloat(incomePeturunan) || 0,
      },
      total_expense: parseFloat(totalExpense) || 0,
      media: mediaFiles.map(m => ({
        cid: m.cid,
        file_name: m.file_name,
        mime_type: m.mime_type,
        ipfs_url: `ipfs://${m.cid}`,
      })),
      timestamp: new Date().toISOString(),
    };
    const metadataCid = await uploadJSONToIPFS(metadataJson, `report_${campaign.id}_${Date.now()}.json`);

    // 3. Amount Snapshot
    const amountSnapshot = JSON.stringify({
      crypto: { amount_usdt: crypto_usdt, amount_usdc: crypto_usdc, fee_idr: Number(crypto_fee_idr) },
      fiat: { amount_idr: fiat_amount_idr, fee_idr: Number(fiat_fee_idr) },
      total_idr,
      locked_rate: {
        usdt_idr: Number(locked_rate_usdt_idr) || 0,
        usdc_idr: Number(locked_rate_usdc_idr) || 0,
        locked_at: locked_rate_at || new Date().toISOString(),
        source: "coingecko",
      },
      unified_lpj: {
        metadata_cid: metadataCid,
        description: description || reason || "",
        total_income: parseFloat(totalIncome) || 0,
        income_system: parseFloat(incomeSystem) || 0,
        income_outside: parseFloat(incomeOutside) || 0,
        income_peturunan: parseFloat(incomePeturunan) || 0,
        total_expense: parseFloat(totalExpense) || 0,
        media_files: mediaFiles
      }
    });

    // 4. Insert Withdraw Request
    const initialStatus = proposal_id ? 'VOTING_IN_PROGRESS' : 'REQUESTED';
    const { rows: wdRows } = await client.query(
      `
      INSERT INTO withdraw_requests (
        admin_pura_id, campaign_id, onchain_campaign_id, campaign_title,
        withdraw_type, amount_snapshot, total_idr, wallet_address,
        reason, ipfs_cid, governance_proposal_id, status
      ) VALUES (
        $1, $2, $3, $4, 'UNIFIED', $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
      `,
      [
        adminPuraId, campaign.id, campaign.id_campaign_onchain, campaign.title,
        amountSnapshot, total_idr, walletAddress,
        reason || description, mediaFiles[0]?.cid || metadataCid, proposal_id, initialStatus
      ]
    );
    const withdrawRequest = wdRows[0];

    // 5. Update Campaign Status
    await client.query(
      `UPDATE campaigns SET status = 'REQUEST WITHDRAW', updated_at = NOW() WHERE id = $1`,
      [campaign.id]
    );

    await client.query("COMMIT");
    return {
      withdrawRequestId: withdrawRequest.id,
      campaignId: campaign.id,
      onchainCampaignId: campaign.id_campaign_onchain,
      walletAddress,
      ipfsCid: metadataCid,
      status: withdrawRequest.status,
      amountSnapshot: JSON.parse(amountSnapshot),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createWithdrawRequest,
  markWithdrawExecuted,
  getWithdrawRequestsByAdmin,
  createUnifiedWithdrawReport,
};