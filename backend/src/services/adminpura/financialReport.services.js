const pool = require("../../db/pool");
const { uploadToIPFS, uploadJSONToIPFS } = require("../ipfsService");
const financialAnchor = require("../../blockchain/financialAnchor.contract");

async function createFinancialReport({ admin, payload, files }) {
  if (!files || files.length === 0) {
    throw new Error("File bukti laporan wajib diunggah (minimal 1)");
  }

  // 🔒 Validasi: Pengeluaran tidak boleh lebih besar dari pemasukan
  const totalIncome = parseFloat(payload.total_income) || 0;
  const totalExpense = parseFloat(payload.total_expense) || 0;

  if (totalExpense > totalIncome) {
    throw new Error("EXPENSE_EXCEEDS_INCOME");
  }

  // Ensure media_files column exists
  try {
    await pool.query(`ALTER TABLE financial_reports ADD COLUMN IF NOT EXISTS media_files TEXT`);
  } catch (err) {
    console.error("Failed to add media_files column:", err);
  }

  // 1️⃣ Upload all files to IPFS
  const uploadedFiles = [];
  for (const file of files) {
    const cid = await uploadToIPFS(file);
    uploadedFiles.push({
      file_name: file.originalname,
      mime_type: file.mimetype,
      cid,
    });
  }

  // 2️⃣ Create JSON metadata
  const metadata = {
    title: payload.title,
    total_income: totalIncome,
    total_expense: totalExpense,
    timestamp: new Date().toISOString(),
    files: uploadedFiles,
  };

  const mainCid = await uploadJSONToIPFS(metadata, "financial_report_metadata.json");

  // 3️⃣ Anchor JSON CID ke blockchain (wallet sistem)
  const tx = await financialAnchor.anchorReport(mainCid);

  // 4️⃣ Simpan metadata + bukti on-chain
  const mediaFilesJson = JSON.stringify(uploadedFiles);
  const { rows } = await pool.query(
    `
    INSERT INTO financial_reports (
      admin_pura_id,
      title,
      total_income,
      total_expense,
      ipfs_cid,
      anchor_tx_hash,
      anchored_at,
      media_files
    ) VALUES (
      $1,$2,$3,$4,$5,$6,NOW(),$7
    )
    RETURNING *
    `,
    [
      admin.admin_pura_id,
      payload.title,
      totalIncome,
      totalExpense,
      mainCid,
      tx.hash,
      mediaFilesJson
    ]
  );

  // 5️⃣ Update Kas Pura (Saldo Operasional)
  // Kas saat ini = selisih income - expense dari laporan yang diupload (REPLACE, bukan akumulasi)
  const kasSaatIni = totalIncome - totalExpense;
  await pool.query(
    `
    UPDATE admin_pura
    SET saldo_operasional = $1
    WHERE id = $2
    `,
    [
      kasSaatIni,
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
