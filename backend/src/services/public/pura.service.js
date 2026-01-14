const pool = require("../../db/pool");

async function listPura() {
  const query = `
    SELECT
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address
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
      saldo_pending_offchain
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
      campaign_type,
      status,
      deadline,
      is_sc_registered,
      is_onchain_enabled,
      is_offchain_enabled,
      id_campaign_onchain
    FROM campaigns
    WHERE admin_pura_id = $1
      AND (is_sc_registered = FALSE OR is_sc_registered IS NULL)
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
      campaign_type,
      status,
      deadline,
      is_sc_registered,
      is_onchain_enabled,
      is_offchain_enabled,
      id_campaign_onchain
    FROM campaigns
    WHERE admin_pura_id = $1
      AND is_sc_registered = TRUE
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
  /* 6. RETURN FINAL           */
  /* ========================= */
  return {
    pura,
    campaigns: {
      db: dbCampaigns.rows,
      sc_only: scCampaignsWithBalance,
    },
  };
}

module.exports = {
  listPura,
  getPuraDetail,
};
