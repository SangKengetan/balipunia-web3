const pool = require("../../db/pool");
const vaultService = require("../vault.service");

const USDT = process.env.USDT_ADDRESS;
const USDC = process.env.USDC_ADDRESS;

async function getAdminPuraDashboardSummary(adminId) {
  // 1. Ambil admin_pura
  const puraRes = await pool.query(
    `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
    [adminId]
  );

  if (!puraRes.rows.length) {
    throw new Error("ADMIN_PURA_NOT_FOUND");
  }

  const adminPuraId = puraRes.rows[0].id;

  // 2. Total campaign (SEMUA, tidak hanya hybrid)
  const campaignCountRes = await pool.query(
    `
    SELECT COUNT(*)::int AS total_campaigns
    FROM campaigns
    WHERE admin_pura_id = $1
    `,
    [adminPuraId]
  );
  const totalCampaigns = campaignCountRes.rows[0].total_campaigns;

  // 3. Total dana off-chain
  const offchainRes = await pool.query(
    `
    SELECT COALESCE(SUM(gross_amount), 0) AS total_offchain
    FROM offchain_transactions t
    JOIN campaigns c ON c.id = t.campaign_id
    WHERE c.admin_pura_id = $1
      AND t.system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    `,
    [adminPuraId]
  );
  const totalOffchain = offchainRes.rows[0].total_offchain;

  // 4. Ambil SEMUA campaign yang on-chain enabled
  const onchainIdsRes = await pool.query(
    `
    SELECT onchain_campaign_id
    FROM campaigns
    WHERE admin_pura_id = $1
      AND is_onchain_enabled = true
    `,
    [adminPuraId]
  );

  let totalOnchainUSDT = 0n;
  let totalOnchainUSDC = 0n;

  for (const row of onchainIdsRes.rows) {
    const cid = row.onchain_campaign_id;

    const balances = await vaultService.getCampaignBalances(
      cid,
      [USDT, USDC]
    );

    totalOnchainUSDT += BigInt(balances[USDT] || 0);
    totalOnchainUSDC += BigInt(balances[USDC] || 0);
  }

  return {
    total_campaigns: totalCampaigns,
    total_offchain: totalOffchain,
    total_onchain: {
      usdt: totalOnchainUSDT.toString(),
      usdc: totalOnchainUSDC.toString(),
    },
  };
}

module.exports = {
  getAdminPuraDashboardSummary,
};
