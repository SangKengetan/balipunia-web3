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

  /**
   * 2️⃣ On-chain balance + donation history
   */
  let onchainBalance = null;
  let donationHistory = [];

  if (campaign.is_onchain_enabled && campaign.onchain_campaign_id) {
    onchainBalance = await vaultService.getCampaignBalances(
      campaign.onchain_campaign_id,
      [USDT, USDC]
    );

    donationHistory = await vaultService.getDonationHistory({
      campaignId: campaign.onchain_campaign_id,
    });
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

  const totalOffchain = offchainRows[0].total_offchain;

  /**
   * 4️⃣ Withdraw timeline
   */
  const { rows: withdrawRows } = await pool.query(
    `
    SELECT
      id,
      withdraw_type,
      amount,
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

    donations: donationHistory,

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
    SELECT *
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

  if (campaign.is_onchain_enabled && campaign.onchain_campaign_id) {
    onchainBalance = await vaultService.getCampaignBalances(
      campaign.onchain_campaign_id,
      [USDT, USDC]
    );

    donationHistory = await vaultService.getDonationHistory({
      campaignId: campaign.onchain_campaign_id,
    });
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

  const totalOffchain = offchainRows[0].total_offchain;

  /**
   * 4️⃣ Withdraw (PUBLIC – tanpa proposal detail)
   */
  const { rows: withdrawRows } = await pool.query(
    `
    SELECT
      withdraw_type,
      amount,
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

    donations: donationHistory.map((d) => ({
      donor: d.donor,
      token: d.token,
      amount: d.amount,
      timestamp: d.timestamp,
    })),

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
