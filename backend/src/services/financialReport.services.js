const pool = require("../db/pool");
const { uploadToIPFS } = require("./ipfsService");
const financialAnchor = require("../blockchain/financialAnchor.contract");

async function createFinancialReport({ admin, payload, file }) {
  if (!file) {
    throw new Error("File laporan keuangan wajib diunggah");
  }

  // 1️⃣ Upload ke IPFS
  const cid = await uploadToIPFS(file);

  // 2️⃣ Anchor CID ke blockchain (wallet sistem)
  const tx = await financialAnchor.anchorReport(cid);
  const receipt = await tx.wait();

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
      receipt.transactionHash,
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
