const pool = require("../db/pool");
const votingService = require("./voting.service");
const { uploadToIPFS } = require("./ipfsService");

/**
 * CREATE WITHDRAW REQUEST (ONCHAIN)
 * Melakukan validasi campaign, insert DB, dan call Blockchain.
 */

async function createOnchainWithdrawRequest({
  adminPuraId,
  campaignId,
  payload,
  file,
}) {
  const { amount, reason } = payload;

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
     2. Validasi SC-ONLY
  ===================================================== */
  if (!campaign.id_campaign_onchain) {
    throw new Error("ONLY_SC_ONLY_ALLOWED");
  }

  /* =====================================================
     3. Validasi Deadline
  ===================================================== */
  const now = new Date();
  const deadline = new Date(campaign.deadline);

  if (now < deadline) {
    throw new Error("CAMPAIGN_NOT_FINISHED");
  }

  /* =====================================================
     4. Cegah Double Withdraw
  ===================================================== */
  if (campaign.status === "REQUEST WITHDRAW") {
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
     6. Insert Withdraw Request
  ===================================================== */
  const { rows: wdRows } = await pool.query(
    `
    INSERT INTO withdraw_requests (
      admin_pura_id,
      campaign_id,
      onchain_campaign_id,
      campaign_title,
      withdraw_type,
      amount_snapshot,
      wallet_address,
      reason,
      ipfs_cid,
      status
    ) VALUES (
      $1, $2, $3, $4,
      'ONCHAIN',
      $5, $6, $7, $8,
      'REQUESTED'
    )
    RETURNING *
    `,
    [
      adminPuraId,
      campaign.id,
      campaign.id_campaign_onchain, // 🔑 SUMBER BENAR
      campaign.title,
      amount, // snapshot (string / text)
      walletAddress,
      reason,
      ipfsCid,
    ]
  );

  const withdrawRequest = wdRows[0];

  /* =====================================================
     7. Update Campaign Status
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
     8. Return
  ===================================================== */
  return {
    withdrawRequestId: withdrawRequest.id,
    campaignId: campaign.id,
    onchainCampaignId: campaign.id_campaign_onchain,
    walletAddress,
    ipfsCid,
    status: withdrawRequest.status,
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
      wr.amount_snapshot,          -- 🔑 ini yang dipakai
      wr.status,
      wr.created_at,
      wr.governance_proposal_id,
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
            finalized: proposal.finalized,
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

module.exports = {
  createOnchainWithdrawRequest,
  markWithdrawExecuted,
  getWithdrawRequestsByAdmin,
};