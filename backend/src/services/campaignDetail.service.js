const pool = require("../db/pool");
const vaultService = require("./vault.service");

const USDT = process.env.USDT_ADDRESS;
const USDC = process.env.USDC_ADDRESS;

/**
 * Ambil detail campaign lengkap (FULL TIMELINE)
 */
async function getCampaignDetailFullService({
  campaignId,
  adminPuraId,
}) {
  /**
   * 1️⃣ Campaign + ownership
   */
  const { rows: campaignRows } = await pool.query(
    `
    SELECT id, admin_pura_id, title, description, purpose, fund_mechanism, campaign_type, 
           id_campaign_onchain, tx_hash, image_url, status, created_at, updated_at, payout_wallet,
           CASE WHEN deadline IS NOT NULL 
             THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
             ELSE NULL 
           END as deadline
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

  /**
   * 2️⃣ On-chain balance + donation history
   */
  let onchainBalance = null;
  let donationHistory = [];

  if (campaign.id_campaign_onchain) {
    onchainBalance = await vaultService.getCampaignBalances(
      campaign.id_campaign_onchain,
      [USDT, USDC]
    );

    const rawDonations = await vaultService.getDonationHistory({
      campaignId: campaign.id_campaign_onchain,
    });

    if (rawDonations.length > 0) {
      const uniqueWallets = [...new Set(rawDonations.map((d) => d.donor.toLowerCase()))];
      const { rows: donorRows } = await pool.query(
        `SELECT d.name, LOWER(dw.wallet_address) AS wallet_address FROM donor_wallets dw JOIN donors d ON d.id = dw.donor_id WHERE LOWER(dw.wallet_address) = ANY($1)`,
        [uniqueWallets]
      );
      
      const walletToNameMap = {};
      donorRows.forEach((row) => {
        walletToNameMap[row.wallet_address] = row.name;
      });

      donationHistory = rawDonations.map((d) => {
        const lowerWallet = d.donor.toLowerCase();
        let tokenSymbol = d.token;
        if (USDT && d.token.toLowerCase() === USDT.toLowerCase()) tokenSymbol = "USDT";
        else if (USDC && d.token.toLowerCase() === USDC.toLowerCase()) tokenSymbol = "USDC";

        return {
          ...d,
          donor: walletToNameMap[lowerWallet] || `${d.donor.slice(0, 6)}...${d.donor.slice(-4)}`,
          original_wallet: d.donor,
          token: tokenSymbol
        };
      });
    }
  }

  /**
   * 3️⃣ Off-chain total
   */
  const { rows: offchainRows } = await pool.query(
    `
    SELECT COALESCE(SUM(gross_amount), 0) AS total_offchain
    FROM offchain_transactions
    WHERE campaign_id = $1
      AND system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    `,
    [campaign.id]
  );

  let totalOffchain = Number(offchainRows[0].total_offchain);

  // Kurangi dengan total Rupiah yang sudah berhasil ditarik (Metode Sweep/Gelombang)
  const { rows: withdrawnRows } = await pool.query(
    `
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN amount_snapshot IS NOT NULL AND amount_snapshot <> '' 
          THEN (amount_snapshot::jsonb->'fiat'->>'amount_idr')::numeric 
          ELSE 0 
        END
      ), 
      0
    ) AS total_withdrawn
    FROM withdraw_requests
    WHERE campaign_id = $1
      AND status IN ('COMPLETED', 'EXECUTED')
    `,
    [campaign.id]
  );
  totalOffchain -= Number(withdrawnRows[0].total_withdrawn);
  if (totalOffchain < 0) totalOffchain = 0;
  totalOffchain = totalOffchain.toString();

  const { rows: offchainDonations } = await pool.query(
    `
    SELECT
      id,
      donor_name,
      gross_amount,
      system_status,
      updated_at
    FROM offchain_transactions
    WHERE campaign_id = $1
      AND system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    ORDER BY updated_at DESC
    `,
    [campaign.id]
  );

  /**
   * 4️⃣ Withdraw timeline
   */
  const { rows: withdrawRows } = await pool.query(
    `
    SELECT
      id,
      withdraw_type,
      amount_snapshot AS amount,
      status,
      governance_proposal_id,
      executed_tx_hash,
      created_at
    FROM withdraw_requests
    WHERE campaign_id = $1
    ORDER BY created_at ASC
    `,
    [campaign.id]
  );

  /**
   * 5️⃣ Campaign reports (IPFS)
   */
  const { rows: reportRows } = await pool.query(
    `
    SELECT
      id,
      file_name,
      ipfs_cid,
      created_at
    FROM campaign_reports
    WHERE campaign_id = $1
    ORDER BY created_at ASC
    `,
    [campaign.id]
  );

  /**
   * 6️⃣ Return structured object
   */
  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      purpose: campaign.purpose,
      campaign_type: campaign.campaign_type,
      deadline: campaign.deadline,
      status: campaign.status,
      created_at: campaign.created_at,
    },

    funds: {
      onchain: onchainBalance,
      offchain: totalOffchain,
    },

    donations: {
      onchain: donationHistory,
      offchain: offchainDonations.map((d) => ({
        donor: d.donor_name,
        amount: d.gross_amount,
        timestamp: d.updated_at,
      })),
    },

    withdraws: withdrawRows,

    reports: reportRows.map((r) => ({
      id: r.id,
      file_name: r.file_name,
      ipfs_url: `${process.env.PINATA_GATEWAY}/ipfs/${r.ipfs_cid}`,
      uploaded_at: r.created_at,
    })),
  };
}

async function getCampaignDetailFullPublicService({ campaignId }) {
  /**
   * 1️⃣ Campaign (tanpa ownership)
   */
  const { rows: campaignRows } = await pool.query(
    `
    SELECT id, admin_pura_id, title, description, purpose, fund_mechanism, campaign_type, 
           id_campaign_onchain, tx_hash, image_url, status, created_at, updated_at, payout_wallet,
           CASE WHEN deadline IS NOT NULL 
             THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
             ELSE NULL 
           END as deadline
    FROM campaigns
    WHERE id = $1
      AND status = 'ACTIVE'
    LIMIT 1
    `,
    [campaignId]
  );

  if (!campaignRows.length) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const campaign = campaignRows[0];

  /**
   * 2️⃣ On-chain balance + donation history
   */
  let onchainBalance = null;
  let donationHistory = [];

  if (campaign.id_campaign_onchain) {
    onchainBalance = await vaultService.getCampaignBalances(
      campaign.id_campaign_onchain,
      [USDT, USDC]
    );

    const rawDonations = await vaultService.getDonationHistory({
      campaignId: campaign.id_campaign_onchain,
    });

    if (rawDonations.length > 0) {
      const uniqueWallets = [...new Set(rawDonations.map((d) => d.donor.toLowerCase()))];
      const { rows: donorRows } = await pool.query(
        `SELECT d.name, LOWER(dw.wallet_address) AS wallet_address FROM donor_wallets dw JOIN donors d ON d.id = dw.donor_id WHERE LOWER(dw.wallet_address) = ANY($1)`,
        [uniqueWallets]
      );
      
      const walletToNameMap = {};
      donorRows.forEach((row) => {
        walletToNameMap[row.wallet_address] = row.name;
      });

      donationHistory = rawDonations.map((d) => {
        const lowerWallet = d.donor.toLowerCase();
        let tokenSymbol = d.token;
        if (USDT && d.token.toLowerCase() === USDT.toLowerCase()) tokenSymbol = "USDT";
        else if (USDC && d.token.toLowerCase() === USDC.toLowerCase()) tokenSymbol = "USDC";

        return {
          ...d,
          donor: walletToNameMap[lowerWallet] || `${d.donor.slice(0, 6)}...${d.donor.slice(-4)}`,
          original_wallet: d.donor,
          token: tokenSymbol
        };
      });
    }
  }

  /**
   * 3️⃣ Off-chain total (PUBLIC – agregat saja)
   */
  const { rows: offchainRows } = await pool.query(
    `
    SELECT COALESCE(SUM(gross_amount), 0) AS total_offchain
    FROM offchain_transactions
    WHERE campaign_id = $1
      AND system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    `,
    [campaign.id]
  );

  let totalOffchain = Number(offchainRows[0].total_offchain);

  // Kurangi dengan total Rupiah yang sudah berhasil ditarik (Metode Sweep/Gelombang)
  const { rows: withdrawnRows } = await pool.query(
    `
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN amount_snapshot IS NOT NULL AND amount_snapshot <> '' 
          THEN (amount_snapshot::jsonb->'fiat'->>'amount_idr')::numeric 
          ELSE 0 
        END
      ), 
      0
    ) AS total_withdrawn
    FROM withdraw_requests
    WHERE campaign_id = $1
      AND status IN ('COMPLETED', 'EXECUTED')
    `,
    [campaign.id]
  );
  totalOffchain -= Number(withdrawnRows[0].total_withdrawn);
  if (totalOffchain < 0) totalOffchain = 0;
  totalOffchain = totalOffchain.toString();

  const { rows: offchainDonations } = await pool.query(
    `
    SELECT
      id,
      donor_name,
      gross_amount,
      system_status,
      updated_at
    FROM offchain_transactions
    WHERE campaign_id = $1
      AND system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    ORDER BY updated_at DESC
    `,
    [campaign.id]
  );

  /**
   * 4️⃣ Withdraw (PUBLIC – tanpa proposal detail)
   */
  const { rows: withdrawRows } = await pool.query(
    `
    SELECT
      withdraw_type,
      amount_snapshot AS amount,
      status,
      created_at
    FROM withdraw_requests
    WHERE campaign_id = $1
      AND status = 'EXECUTED'
    ORDER BY created_at ASC
    `,
    [campaign.id]
  );

  /**
   * 5️⃣ Laporan Kampanye (IPFS)
   */
  const { rows: reportRows } = await pool.query(
    `
    SELECT
      file_name,
      ipfs_cid,
      created_at
    FROM campaign_reports
    WHERE campaign_id = $1
    ORDER BY created_at ASC
    `,
    [campaign.id]
  );

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      purpose: campaign.purpose,
      campaign_type: campaign.campaign_type,
      deadline: campaign.deadline,
    },

    funds: {
      onchain: onchainBalance,
      offchain: totalOffchain,
    },

    donations: {
      onchain: donationHistory.map((d) => ({
        donor: d.donor,
        token: d.token,
        amount: d.amount,
        timestamp: d.timestamp,
      })),
      offchain: offchainDonations.map((d) => ({
        donor: d.donor_name,
        amount: d.gross_amount,
        timestamp: d.updated_at,
      })),
    },

    withdraws: withdrawRows,

    reports: reportRows.map((r) => ({
      file_name: r.file_name,
      ipfs_url: `${process.env.PINATA_GATEWAY}/ipfs/${r.ipfs_cid}`,
      uploaded_at: r.created_at,
    })),
  };
}

module.exports = {
  getCampaignDetailFullService, getCampaignDetailFullPublicService
};
