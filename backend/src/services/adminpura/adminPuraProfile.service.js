const pool = require("../../db/pool");
const votingContract = require("../../blockchain/voting.contract");

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
      bank_account_number,
      bank_account_name,
      profile_picture,
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

  const profile = rows[0];

  // Cek apakah trustee sudah terdaftar di smart contract
  let is_trustees_registered = false;
  if (profile.wallet_address) {
    try {
      const trustees = await votingContract.getTrustees(profile.wallet_address);
      // Jika trustee pertama bukan address 0x00, maka dianggap sudah terdaftar (karena pendaftaran wajib 3 trustee sekaligus)
      if (trustees && trustees[0] !== "0x0000000000000000000000000000000000000000") {
        is_trustees_registered = true;
      }
    } catch (err) {
      console.error("Gagal mengambil data trustee dari SC:", err.message);
    }
  }

  profile.is_trustees_registered = is_trustees_registered;

  // Hitung persentase kelengkapan profil (9 komponen wajib sekarang)
  const requiredFields = [
    profile.nama_pura,
    profile.alamat_pura,
    profile.kontak_pura,
    profile.wallet_address,
    profile.bank_name,
    profile.bank_account_number,
    profile.bank_account_name,
    profile.profile_picture,
    is_trustees_registered
  ];

  let filledCount = 0;
  for (const field of requiredFields) {
    if (field !== null && field !== undefined && field !== "" && field !== false) {
      filledCount++;
    }
  }

  profile.profile_completion_percentage = Math.round((filledCount / requiredFields.length) * 100);

  return profile;
}

async function updateAdminPuraProfile(adminId, payload) {
  const {
    nama_pura,
    alamat_pura,
    kontak_pura,
    wallet_address,
    bank_name,
    bank_account_number,
    bank_account_name,
    profile_picture
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
      bank_account_number = COALESCE($6, bank_account_number),
      bank_account_name = COALESCE($7, bank_account_name),
      profile_picture = COALESCE($8, profile_picture)
    WHERE admin_id = $9
    RETURNING
      id,
      nama_pura,
      alamat_pura,
      kontak_pura,
      wallet_address,
      bank_name,
      bank_account_number,
      bank_account_name,
      profile_picture,
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
      bank_account_number,
      bank_account_name,
      profile_picture,
      adminId
    ]
  );

  if (!rowCount) {
    throw new Error("ADMIN_PURA_NOT_FOUND");
  }

  // Panggil kembali getAdminPuraProfile agar persentase & trustee status ikut terupdate dan dikembalikan
  return await getAdminPuraProfile(adminId);
}

module.exports = {
  getAdminPuraProfile,
  updateAdminPuraProfile
};
