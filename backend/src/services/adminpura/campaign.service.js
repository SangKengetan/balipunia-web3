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
    campaign_type,
    deadline,
  } = payload;

  const deadlineValue = deadline ? deadline : null;

  const { rows } = await pool.query(
    `
    INSERT INTO campaigns (
      admin_pura_id,
      title,
      description,
      purpose,
      campaign_type,
      id_campaign_onchain,
      tx_hash,
      deadline,
      status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE'
    )
    RETURNING *
    `,
    [
      adminPuraId,
      title,
      description,
      purpose,
      campaign_type, // 'HYBRID' | 'MIDTRANS_ONLY' | 'CRYPTO_ONLY'
      id_campaign_onchain,
      tx_hash,
      deadlineValue,
    ]
  );

  return rows[0];
}

module.exports = {
  syncCampaignFromChain,
};