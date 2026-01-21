const {
  getAdminPuraDashboardSummary
} = require("../../services/adminpura/adminDashboard.service");

async function getAdminPuraDashboardSummaryHandler(req, res) {
  try {
    const admin = req.admin;

    const data = await getAdminPuraDashboardSummary(admin.id);

    return res.status(200).json({
      message: "Dashboard summary fetched",
      data
    });
  } catch (err) {
    if (err.message === "ADMIN_PURA_NOT_FOUND") {
      return res.status(403).json({ message: "Admin pura tidak ditemukan" });
    }
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil ringkasan dashboard"
    });
  }
}

module.exports = {
  getAdminPuraDashboardSummaryHandler
};
