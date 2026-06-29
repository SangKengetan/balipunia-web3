const service = require("../../services/adminpura/financialReport.services");


async function createReport(req, res, next) {
  try {
    const admin = req.admin;
    const files = req.files;
    const payload = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "File bukti laporan wajib diunggah (minimal 1)",
      });
    }

    if (!admin.admin_pura_id) {
      return res.status(400).json({
        message: "Admin belum terasosiasi dengan pura",
      });
    }

    const report = await service.createFinancialReport({
      admin,
      payload,
      files,
    });

    res.status(201).json({
      message: "Laporan keuangan berhasil dipublish & di-anchor",
      report,
    });
  } catch (err) {
    if (err.message === "EXPENSE_EXCEEDS_INCOME") {
      return res.status(400).json({
        message: "Pengeluaran tidak boleh lebih besar dari pemasukan",
      });
    }
    next(err);
  }
}

async function listReports(req, res, next) {
  try {
    const admin = req.admin;

    if (!admin.admin_pura_id) {
      return res.status(400).json({
        message: "Admin belum terasosiasi dengan pura",
      });
    }

    const reports = await service.listFinancialReports(
      admin.admin_pura_id // ✅ BUKAN admin.id
    );

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReport,
  listReports,
};
