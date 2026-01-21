const service = require("../../services/adminpura/financialReport.services");


async function createReport(req, res, next) {
  try {
    const admin = req.admin;
    const file = req.file;
    const payload = req.body;

    if (!file) {
      return res.status(400).json({
        message: "File laporan keuangan wajib diunggah",
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
      file,
    });

    res.status(201).json({
      message: "Laporan keuangan berhasil dipublish & di-anchor",
      report,
    });
  } catch (err) {
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
