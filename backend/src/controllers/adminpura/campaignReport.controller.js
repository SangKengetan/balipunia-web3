const reportService = require("../../services/campaignReport.service");

/**
 * POST /admin/campaign/:campaignId/report
 */
async function uploadReport(req, res) {
  try {
    const admin = req.admin;
    const { campaignId } = req.params;
    const file = req.file;

    // Validasi input dasar (HTTP level)
    if (!file) {
      return res.status(400).json({ message: "File wajib diunggah" });
    }

    // Panggil Service untuk menangani semua logika bisnis & database
    // Kita passing data yang diperlukan saja
    const report = await reportService.uploadCampaignReport({
      adminPuraId: admin.id,
      campaignId,
      file,
    });

    res.json({
      message: "Laporan kampanye berhasil diunggah",
      report,
    });

  } catch (error) {
    // Error Handling: Menangkap error spesifik dari service
    console.error("Upload Report Error:", error.message);

    if (
      error.message === "CAMPAIGN_NOT_FOUND" || 
      error.message === "NO_EXECUTED_WD"
    ) {
      // Ubah pesan error teknis menjadi pesan user-friendly
      const messages = {
        CAMPAIGN_NOT_FOUND: "Campaign tidak ditemukan atau bukan milik Anda.",
        NO_EXECUTED_WD: "Belum ada withdraw dengan status EXECUTED untuk campaign ini.",
      };
      return res.status(400).json({ message: messages[error.message] });
    }

    // Error server umum
    res.status(500).json({ message: "Terjadi kesalahan internal server" });
  }
}

/**
 * GET /admin/campaign/:campaignId/reports
 * (Admin Pura – authenticated)
 */
async function getCampaignReportsAdmin(req, res) {
  try {
    const { campaignId } = req.params;
    const reports = await reportService.getCampaignReports(campaignId);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data laporan" });
  }
}

/**
 * GET /campaign/:campaignId/reports
 * (Public – read-only, untuk donatur)
 */
async function getCampaignReportsPublic(req, res) {
  try {
    const { campaignId } = req.params;
    const reports = await reportService.getCampaignReports(campaignId);

    // Mapping data untuk public (menyembunyikan internal ID jika perlu, formatting URL)
    res.json(
      reports.map((r) => ({
        id: r.id,
        campaign_title: r.campaign_title,
        file_name: r.file_name,
        ipfs_url: `${process.env.PINATA_GATEWAY}/ipfs/${r.ipfs_cid}`,
        created_at: r.created_at,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data laporan publik" });
  }
}

module.exports = {
  uploadReport,
  getCampaignReportsAdmin,
  getCampaignReportsPublic,
};