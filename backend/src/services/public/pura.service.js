const pool = require("../../db/pool");

async function listPura() {
  const query = `
    SELECT
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      profile_picture
    FROM admin_pura
    ORDER BY nama_pura ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}
const {
  getOnchainBalances, getCampaignBalancesRaw
} = require('../../services/vault.service');
const { ethers } = require("ethers");

async function getPuraDetail(puraId) {
  /* ========================= */
  /* 1. DATA PURA              */
  /* ========================= */
  const puraQuery = `
    SELECT
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      saldo_operasional,
      saldo_pending_onchain,
      saldo_pending_offchain,
      profile_picture
    FROM admin_pura
    WHERE id::text = $1 OR REPLACE(LOWER(nama_pura), ' ', '-') = LOWER($1)
  `;
  const puraResult = await pool.query(puraQuery, [puraId]);
  const pura = puraResult.rows[0];

  if (!pura) {
    throw new Error("PURA_NOT_FOUND");
  }

  const actualPuraId = pura.id;

  /* ======================================================= */
  /* 2. PARALLEL: Campaigns + Stats DB queries sekaligus     */
  /* ======================================================= */
  const [
    dbCampaignsResult,
    scCampaignsResult,
    offchainRes,
    withdrawnOffchainRes,
    pendingTransferRes,
    onchainIdsRes
  ] = await Promise.all([
    // Campaign HYBRID/MIDTRANS_ONLY
    pool.query(`
      SELECT id, title, description, purpose, campaign_type, status,
        CASE WHEN deadline IS NOT NULL 
          THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
          ELSE NULL 
        END as deadline,
        id_campaign_onchain, image_url
      FROM campaigns
      WHERE admin_pura_id = $1
        AND campaign_type IN ('HYBRID', 'MIDTRANS_ONLY')
    `, [actualPuraId]),

    // Campaign CRYPTO_ONLY
    pool.query(`
      SELECT id, title, description, purpose, campaign_type, status,
        CASE WHEN deadline IS NOT NULL 
          THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
          ELSE NULL 
        END as deadline,
        id_campaign_onchain, image_url
      FROM campaigns
      WHERE admin_pura_id = $1
        AND campaign_type = 'CRYPTO_ONLY'
    `, [actualPuraId]),

    // Stats: Offchain total
    pool.query(`
      SELECT COALESCE(SUM(gross_amount), 0) AS total_offchain
      FROM offchain_transactions t
      JOIN campaigns c ON c.id = t.campaign_id
      WHERE c.admin_pura_id = $1
        AND t.system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    `, [actualPuraId]),

    // Stats: Offchain withdrawn
    pool.query(`
      SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_withdrawn_offchain
      FROM withdraw_requests
      WHERE admin_pura_id = $1
        AND status IN ('EXECUTED', 'COMPLETED')
    `, [actualPuraId]),

    // Stats: Offchain pending
    pool.query(`
      SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_pending_transfer
      FROM withdraw_requests
      WHERE admin_pura_id = $1
        AND status NOT IN ('REJECTED', 'EXECUTED', 'COMPLETED')
    `, [actualPuraId]),

    // Stats: Onchain campaign IDs
    pool.query(`
      SELECT id_campaign_onchain
      FROM campaigns
      WHERE admin_pura_id = $1
        AND id_campaign_onchain IS NOT NULL
    `, [actualPuraId]),
  ]);

  /* ========================= */
  /* 3. FORMAT SC CAMPAIGNS    */
  /* ========================= */
  const formattedScCampaigns = scCampaignsResult.rows.map((campaign) => ({
    ...campaign,
    id_campaign_onchain: campaign.id_campaign_onchain
      ? campaign.id_campaign_onchain.toString()
      : null,
  }));

  /* ============================================================ */
  /* 4. PARALLEL: SC balances + Onchain stats (blockchain calls)  */
  /* ============================================================ */
  const USDT = process.env.USDT_ADDRESS;
  const USDC = process.env.USDC_ADDRESS;

  // Jalankan SC balance dan onchain stats secara paralel
  const [scCampaignsWithBalance, onchainTotals] = await Promise.all([
    // A. SC Campaign balances
    Promise.all(
      formattedScCampaigns.map(async (campaign) => {
        if (!campaign.id_campaign_onchain) {
          return { ...campaign, balances: { USDT: "0", USDC: "0" } };
        }
        try {
          const balances = await getOnchainBalances(BigInt(campaign.id_campaign_onchain));
          return { ...campaign, balances };
        } catch (err) {
          return { ...campaign, balances: { USDT: "0", USDC: "0" } };
        }
      })
    ),

    // B. Onchain totals — PARALLEL instead of sequential for-loop
    (async () => {
      const rows = onchainIdsRes.rows.filter(r => r.id_campaign_onchain);
      if (rows.length === 0) return { usdt: 0n, usdc: 0n };

      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            const balances = await getCampaignBalancesRaw(
              row.id_campaign_onchain,
              [USDT, USDC]
            );
            return {
              usdt: balances[USDT] || 0n,
              usdc: balances[USDC] || 0n,
            };
          } catch (e) {
            return { usdt: 0n, usdc: 0n };
          }
        })
      );

      return results.reduce(
        (acc, cur) => ({
          usdt: acc.usdt + cur.usdt,
          usdc: acc.usdc + cur.usdc,
        }),
        { usdt: 0n, usdc: 0n }
      );
    })(),
  ]);

  /* ========================= */
  /* 5. HITUNG STATS OFFCHAIN  */
  /* ========================= */
  const totalOffchain = offchainRes.rows[0].total_offchain;
  const totalWithdrawnOffchain = withdrawnOffchainRes.rows[0].total_withdrawn_offchain;
  const totalPendingTransferOffchain = pendingTransferRes.rows[0].total_pending_transfer;
  const totalAvailableOffchain = totalOffchain - totalWithdrawnOffchain - totalPendingTransferOffchain;

  /* ========================= */
  /* 6. RETURN FINAL           */
  /* ========================= */
  return {
    pura,
    campaigns: {
      db: dbCampaignsResult.rows,
      sc_only: scCampaignsWithBalance,
    },
    stats: {
      total_available_offchain: totalAvailableOffchain,
      total_pending_transfer_offchain: totalPendingTransferOffchain,
      total_onchain: {
        usdt: ethers.formatUnits(onchainTotals.usdt, 18),
        usdc: ethers.formatUnits(onchainTotals.usdc, 18),
      }
    }
  };
}

module.exports = {
  listPura,
  getPuraDetail,
};
