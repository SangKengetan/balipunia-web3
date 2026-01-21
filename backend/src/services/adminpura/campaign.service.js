// services/campaign.service.js
const pool = require("../../db/pool");

/**
 * CREATE CAMPAIGN (HYBRID DEFAULT)
 * Menggunakan auto-increment manual agar id_campaign_onchain berurutan
 */
async function createHybridCampaign(adminPuraId, payload) {
  const {
    title,
    description,
    purpose,
    deadline,
    is_offchain_enabled = true,
    is_onchain_enabled = true,
  } = payload;

  // Kita tidak lagi menggunakan Date.now().
  // ID akan digenerate langsung di dalam query SQL di bawah.

  const { rows } = await pool.query(
    `
    INSERT INTO campaigns (
      admin_pura_id,
      title,
      description,
      purpose,
      campaign_type,
      id_campaign_onchain, 
      is_sc_registered,
      is_offchain_enabled,
      is_onchain_enabled,
      deadline
    ) VALUES (
      $1, $2, $3, $4,
      'HYBRID',
      
      -- LOGIKA BERURUTAN (SEQUENTIAL):
      -- Ambil ID terbesar yg ada, kalau null anggap 0, lalu tambah 1
      (SELECT COALESCE(MAX(id_campaign_onchain), 0) + 1 FROM campaigns),
      
      false,
      $5, $6, $7
    )
    RETURNING *
    `,
    [
      adminPuraId,
      title,
      description,
      purpose,
      // Parameter digeser karena ID sekarang di-handle SQL
      is_offchain_enabled,
      is_onchain_enabled,
      deadline,
    ]
  );

  return rows[0];
}

/**
 * CREATE SC-ONLY CAMPAIGN
 * (dipanggil SETELAH registerScCampaign di Vault/Blockchain)
 * ID diambil dari payload karena Blockchain yang menentukan urutannya.
 */
async function createScOnlyCampaign(adminPuraId, payload) {
  const {
    title,
    description,
    purpose,
    deadline,
    id_campaign_onchain, // Pastikan FE/Blockchain mengirim key ini
  } = payload;

  const { rows } = await pool.query(
    `
    INSERT INTO campaigns (
      admin_pura_id,
      title,
      description,
      purpose,
      campaign_type,
      id_campaign_onchain, -- NAMA KOLOM BARU
      is_sc_registered,
      is_offchain_enabled,
      is_onchain_enabled,
      deadline
    ) VALUES (
      $1, $2, $3, $4,
      'SC-ONLY',
      $5, -- Nilai dari input (karena sudah ada di blockchain)
      true,
      false,
      true,
      $6
    )
    RETURNING *
    `,
    [
      adminPuraId,
      title,
      description,
      purpose,
      id_campaign_onchain,
      deadline,
    ]
  );

  return rows[0];
}

module.exports = {
  createHybridCampaign,
  createScOnlyCampaign,
};