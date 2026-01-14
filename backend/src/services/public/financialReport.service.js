const pool = require('../../db/pool');

/**
 * List laporan keuangan per pura (public)
 */
async function getFinancialReportsByPura(adminPuraId) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      title,
      total_income,
      total_expense,
      ipfs_cid,
      anchor_tx_hash,
      anchored_at,
      created_at
    FROM financial_reports
    WHERE admin_pura_id = $1
    ORDER BY created_at DESC
    `,
    [adminPuraId]
  );

  return rows;
}

/**
 * Detail laporan keuangan (public)
 */
async function getFinancialReportDetail(reportId) {
  const { rows } = await pool.query(
    `
    SELECT
      fr.id,
      fr.title,
      fr.total_income,
      fr.total_expense,
      fr.ipfs_cid,
      fr.anchor_tx_hash,
      fr.anchored_at,
      fr.created_at,
      ap.nama_pura,
      ap.alamat_pura
    FROM financial_reports fr
    JOIN admin_pura ap ON ap.id = fr.admin_pura_id
    WHERE fr.id = $1
    LIMIT 1
    `,
    [reportId]
  );

  if (!rows.length) {
    throw new Error('FINANCIAL_REPORT_NOT_FOUND');
  }

  return rows[0];
}

module.exports = {
  getFinancialReportsByPura,
  getFinancialReportDetail,
};
