const pool = require("../db/pool");

async function getAdminPuraProfile(adminId) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      bank_name,
      bank_account,
      saldo_operasional,
      saldo_pending_onchain,
      saldo_pending_offchain,
      created_at
    FROM admin_pura
    WHERE admin_id = $1
    LIMIT 1
    `,
    [adminId]
  );

  if (!rows.length) {
    throw new Error("ADMIN_PURA_NOT_FOUND");
  }

  return rows[0];
}

async function updateAdminPuraProfile(adminId, payload) {
  const {
    nama_pura,
    alamat_pura,
    kontak_pura,
    wallet_address,
    bank_name,
    bank_account
  } = payload;

  const { rows, rowCount } = await pool.query(
    `
    UPDATE admin_pura
    SET
      nama_pura = COALESCE($1, nama_pura),
      alamat_pura = COALESCE($2, alamat_pura),
      kontak_pura = COALESCE($3, kontak_pura),
      wallet_address = COALESCE($4, wallet_address),
      bank_name = COALESCE($5, bank_name),
      bank_account = COALESCE($6, bank_account)
    WHERE admin_id = $7
    RETURNING
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      bank_name,
      bank_account,
      saldo_operasional,
      saldo_pending_onchain,
      saldo_pending_offchain,
      created_at
    `,
    [
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      bank_name,
      bank_account,
      adminId
    ]
  );

  if (!rowCount) {
    throw new Error("ADMIN_PURA_NOT_FOUND");
  }

  return rows[0];
}

module.exports = {
  getAdminPuraProfile,
  updateAdminPuraProfile
};
