const pool = require("../../db/pool");
const vaultService = require("../vault.service");
const { ethers } = require("ethers");

const USDT = process.env.USDT_ADDRESS;
const USDC = process.env.USDC_ADDRESS;

async function getAdminPuraDashboardSummary(adminId) {
  // 1. Ambil admin_pura dan saldo_operasional
  const puraRes = await pool.query(
    `SELECT id, saldo_operasional FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
    [adminId]
  );

  if (!puraRes.rows.length) {
    throw new Error("ADMIN_PURA_NOT_FOUND");
  }

  const adminPuraId = puraRes.rows[0].id;
  const saldoOperasional = puraRes.rows[0].saldo_operasional;

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

  // 3. Total dana off-chain terkumpul
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

  // 3b. Total dana off-chain yang sudah dikirimkan / ditarik sepenuhnya
  const withdrawnOffchainRes = await pool.query(
    `
    SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_withdrawn_offchain
    FROM withdraw_requests
    WHERE admin_pura_id = $1
      AND status IN ('EXECUTED', 'COMPLETED')
    `,
    [adminPuraId]
  );
  const totalWithdrawnOffchain = withdrawnOffchainRes.rows[0].total_withdrawn_offchain;

  // 3c. Total dana off-chain yang diajukan tapi belum selesai (Pending)
  const pendingTransferRes = await pool.query(
    `
    SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_pending_transfer
    FROM withdraw_requests
    WHERE admin_pura_id = $1
      AND status NOT IN ('REJECTED', 'EXECUTED', 'COMPLETED')
    `,
    [adminPuraId]
  );
  const totalPendingTransferOffchain = pendingTransferRes.rows[0].total_pending_transfer;

  // 3d. Dana Tersedia (Offchain) = Total Terkumpul - (Sudah Ditarik + Sedang Diajukan)
  const totalAvailableOffchain = totalOffchain - totalWithdrawnOffchain - totalPendingTransferOffchain;

  // 4. Ambil SEMUA campaign yang on-chain enabled
  const onchainIdsRes = await pool.query(
    `
    SELECT id_campaign_onchain
    FROM campaigns
    WHERE admin_pura_id = $1
      AND id_campaign_onchain IS NOT NULL
    `,
    [adminPuraId]
  );

  let totalOnchainUSDT = 0n;
  let totalOnchainUSDC = 0n;

  for (const row of onchainIdsRes.rows) {
    const cid = row.id_campaign_onchain;
    if (!cid) continue;

    const balances = await vaultService.getCampaignBalancesRaw(
      cid,
      [USDT, USDC]
    );

    totalOnchainUSDT += balances[USDT] || 0n;
    totalOnchainUSDC += balances[USDC] || 0n;
  }

  return {
    saldo_operasional: saldoOperasional,
    total_campaigns: totalCampaigns,
    total_offchain: totalOffchain,
    total_available_offchain: totalAvailableOffchain,
    total_withdrawn_offchain: totalWithdrawnOffchain,
    total_pending_transfer_offchain: totalPendingTransferOffchain,
    total_onchain: {
      usdt: ethers.formatUnits(totalOnchainUSDT, 18),
      usdc: ethers.formatUnits(totalOnchainUSDC, 18),
    },
  };
}

module.exports = {
  getAdminPuraDashboardSummary,
};
