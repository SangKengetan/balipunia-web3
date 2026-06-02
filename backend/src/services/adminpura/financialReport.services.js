const pool = require("../../db/pool");
const { uploadToIPFS } = require("../ipfsService");
const financialAnchor = require("../../blockchain/financialAnchor.contract");

async function createFinancialReport({ admin, payload, file }) {
  if (!file) {
    throw new Error("File laporan keuangan wajib diunggah");
  }

  // 1️⃣ Upload ke IPFS
  const cid = await uploadToIPFS(file);

  // 2️⃣ Anchor CID ke blockchain (wallet sistem)
  // Tidak perlu di-await hingga selesai ditambang (tx.wait()) agar proses UI cepat.
  // Sistem akan memprosesnya di latar belakang.
  const tx = await financialAnchor.anchorReport(cid);

  // 3️⃣ Simpan metadata + bukti on-chain
  const { rows } = await pool.query(
    `
    INSERT INTO financial_reports (
      admin_pura_id,
      title,
      total_income,
      total_expense,
      ipfs_cid,
      anchor_tx_hash,
      anchored_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,NOW()
    )
    RETURNING *
    `,
    [
      admin.admin_pura_id,
      payload.title,
      payload.total_income,
      payload.total_expense,
      cid,
      tx.hash,
    ]
  );

  // 4️⃣ Update Kas Pura (Saldo Operasional)
  await pool.query(
    `
    UPDATE admin_pura
    SET saldo_operasional = saldo_operasional + $1 - $2
    WHERE id = $3
    `,
    [
      payload.total_income || 0,
      payload.total_expense || 0,
      admin.admin_pura_id
    ]
  );

  return rows[0];
}

async function listFinancialReports(adminPuraId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM financial_reports
    WHERE admin_pura_id = $1
    ORDER BY created_at DESC
    `,
    [adminPuraId]
  );

  return rows;
}

module.exports = {
  createFinancialReport,
  listFinancialReports,
};
