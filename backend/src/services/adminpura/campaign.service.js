// services/campaign.service.js
const pool = require("../../db/pool");

/**
 * SYNC CAMPAIGN FROM CHAIN
 * 
 * Semua tipe kegiatan (HYBRID, MIDTRANS_ONLY, CRYPTO_ONLY) sekarang
 * wajib teregistrasi di blockchain terlebih dahulu.
 * Fungsi ini hanya menyimpan metadata ke database setelah tx on-chain sukses.
 */
async function syncCampaignFromChain(adminPuraId, payload) {
  const {
    id_campaign_onchain,
    tx_hash,
    title,
    description,
    purpose,
    fund_mechanism,
    campaign_type,
    deadline,
    image_url,
  } = payload;

  const deadlineValue = deadline ? deadline : null;

  const { rows } = await pool.query(
    `
    INSERT INTO campaigns (
      admin_pura_id,
      title,
      description,
      purpose,
      fund_mechanism,
      campaign_type,
      id_campaign_onchain,
      tx_hash,
      deadline,
      image_url,
      status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE'
    )
    RETURNING *
    `,
    [
      adminPuraId,
      title,
      description,
      purpose,
      fund_mechanism,
      campaign_type, // 'HYBRID' | 'MIDTRANS_ONLY' | 'CRYPTO_ONLY'
      id_campaign_onchain,
      tx_hash,
      deadlineValue,
      image_url,
    ]
  );

  return rows[0];
}

module.exports = {
  syncCampaignFromChain,
};