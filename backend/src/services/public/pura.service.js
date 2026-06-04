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
  getAllScOnlyCampaigns, getOnchainBalances
} = require('../../services/vault.service');

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
    WHERE id = $1
  `;
  const puraResult = await pool.query(puraQuery, [puraId]);
  const pura = puraResult.rows[0];

  if (!pura) {
    throw new Error("PURA_NOT_FOUND");
  }

  /* ========================= */
  /* 2. CAMPAIGN DB (HYBRID)   */
  /* ========================= */
  const dbCampaignQuery = `
    SELECT
      id,
      title,
      description,
      purpose,
      campaign_type,
      status,
      CASE WHEN deadline IS NOT NULL 
        THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
        ELSE NULL 
      END as deadline,
      id_campaign_onchain,
      image_url
    FROM campaigns
    WHERE admin_pura_id = $1
      AND campaign_type IN ('HYBRID', 'MIDTRANS_ONLY')
  `;
  const dbCampaigns = await pool.query(dbCampaignQuery, [puraId]);

  /* ========================= */
  /* 3. CAMPAIGN SC-ONLY (DB)  */
  /* ========================= */
  const scCampaignQuery = `
    SELECT
      id,
      title,
      description,
      purpose,
      campaign_type,
      status,
      CASE WHEN deadline IS NOT NULL 
        THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
        ELSE NULL 
      END as deadline,
      id_campaign_onchain,
      image_url
    FROM campaigns
    WHERE admin_pura_id = $1
      AND campaign_type = 'CRYPTO_ONLY'
  `;
  const scCampaignsDb = await pool.query(scCampaignQuery, [puraId]);

  /* ========================= */
  /* 4. FORMAT ID ONCHAIN      */
  /* ========================= */
  const formattedScCampaigns = scCampaignsDb.rows.map((campaign) => ({
    ...campaign,
    id_campaign_onchain: campaign.id_campaign_onchain
      ? campaign.id_campaign_onchain.toString()
      : null,
  }));

  /* ========================= */
  /* 5. AMBIL SALDO ONCHAIN    */
  /* ========================= */
  const scCampaignsWithBalance = await Promise.all(
    formattedScCampaigns.map(async (campaign) => {
      if (!campaign.id_campaign_onchain) {
        return {
          ...campaign,
          balances: { USDT: "0", USDC: "0" },
        };
      }

      try {
        const balances = await getOnchainBalances(
          BigInt(campaign.id_campaign_onchain)
        );

        return {
          ...campaign,
          balances,
        };
      } catch (err) {
        // ❗ blockchain error tidak boleh bikin API gagal
        return {
          ...campaign,
          balances: { USDT: "0", USDC: "0" },
        };
      }
    })
  );

  /* ========================= */
  /* 5.5. HITUNG STATS DANA BELUM DICAIRKAN */
  /* ========================= */
  // 1. Offchain total
  const offchainRes = await pool.query(
    `
    SELECT COALESCE(SUM(gross_amount), 0) AS total_offchain
    FROM offchain_transactions t
    JOIN campaigns c ON c.id = t.campaign_id
    WHERE c.admin_pura_id = $1
      AND t.system_status IN ('PAID_LOCKED','APPROVED','WITHDRAWN')
    `,
    [puraId]
  );
  const totalOffchain = offchainRes.rows[0].total_offchain;

  // 2. Offchain withdrawn
  const withdrawnOffchainRes = await pool.query(
    `
    SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_withdrawn_offchain
    FROM withdraw_requests
    WHERE admin_pura_id = $1
      AND status IN ('EXECUTED', 'COMPLETED')
    `,
    [puraId]
  );
  const totalWithdrawnOffchain = withdrawnOffchainRes.rows[0].total_withdrawn_offchain;

  // 3. Offchain pending
  const pendingTransferRes = await pool.query(
    `
    SELECT COALESCE(SUM(((amount_snapshot::jsonb)->'fiat'->>'amount_idr')::numeric), 0) AS total_pending_transfer
    FROM withdraw_requests
    WHERE admin_pura_id = $1
      AND status NOT IN ('REJECTED', 'EXECUTED', 'COMPLETED')
    `,
    [puraId]
  );
  const totalPendingTransferOffchain = pendingTransferRes.rows[0].total_pending_transfer;

  const totalAvailableOffchain = totalOffchain - totalWithdrawnOffchain - totalPendingTransferOffchain;

  // 4. Crypto Total
  const { ethers } = require("ethers");
  const USDT = process.env.USDT_ADDRESS;
  const USDC = process.env.USDC_ADDRESS;
  
  const onchainIdsRes = await pool.query(
    `
    SELECT id_campaign_onchain
    FROM campaigns
    WHERE admin_pura_id = $1
      AND id_campaign_onchain IS NOT NULL
    `,
    [puraId]
  );

  let totalOnchainUSDT = 0n;
  let totalOnchainUSDC = 0n;

  for (const row of onchainIdsRes.rows) {
    const cid = row.id_campaign_onchain;
    if (!cid) continue;

    try {
      const balances = await require('../../services/vault.service').getCampaignBalancesRaw(
        cid,
        [USDT, USDC]
      );
      totalOnchainUSDT += balances[USDT] || 0n;
      totalOnchainUSDC += balances[USDC] || 0n;
    } catch(e) {}
  }

  /* ========================= */
  /* 6. RETURN FINAL           */
  /* ========================= */
  return {
    pura,
    campaigns: {
      db: dbCampaigns.rows,
      sc_only: scCampaignsWithBalance,
    },
    stats: {
      total_available_offchain: totalAvailableOffchain,
      total_pending_transfer_offchain: totalPendingTransferOffchain,
      total_onchain: {
        usdt: ethers.formatUnits(totalOnchainUSDT, 18),
        usdc: ethers.formatUnits(totalOnchainUSDC, 18),
      }
    }
  };
}

module.exports = {
  listPura,
  getPuraDetail,
};
