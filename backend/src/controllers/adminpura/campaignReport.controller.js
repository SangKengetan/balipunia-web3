const reportService = require("../../services/campaignReport.service");

/**
 * POST /admin/campaign/:campaignId/report
 */
async function uploadReport(req, res) {
  try {
    const admin = req.admin;
    const { campaignId } = req.params;
    const files = req.files; // array dari multer upload.array()
    const { total_income, total_expense, description, income_system, income_outside, income_peturunan } = req.body;

    // Validasi input dasar (HTTP level)
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Minimal satu file dokumentasi wajib diunggah" });
    }

    // Panggil Service untuk menangani IPFS JSON Metadata pattern
    const report = await reportService.uploadCampaignReport({
      adminPuraId: admin.admin_pura_id,
      campaignId,
      files,
      description,
      totalIncome: total_income,
      incomeSystem: income_system,
      incomeOutside: income_outside,
      incomePeturunan: income_peturunan,
      totalExpense: total_expense,
    });

    res.json({
      message: "Laporan kampanye berhasil diunggah & dihash ke IPFS",
      report,
    });

  } catch (error) {
    // Error Handling: Menangkap error spesifik dari service
    console.error("Upload Report Error:", error.message);

    if (
      error.message === "CAMPAIGN_NOT_FOUND" ||
      error.message === "NO_PENDING_WITHDRAWAL_TO_REPORT" ||
      error.message === "CAMPAIGN_NOT_READY_FOR_REPORT"
    ) {
      // Ubah pesan error teknis menjadi pesan user-friendly
      const messages = {
        CAMPAIGN_NOT_FOUND: "Campaign tidak ditemukan atau bukan milik Anda.",
        NO_PENDING_WITHDRAWAL_TO_REPORT: "Belum ada pencairan dana yang dapat dilaporkan untuk campaign ini.",
        CAMPAIGN_NOT_READY_FOR_REPORT: "Campaign belum pernah melakukan pencairan (WITHDRAWN) atau sedang tidak aktif.",
      };
      return res.status(400).json({ message: messages[error.message] });
    }

    // Error server umum
    res.status(500).json({ message: "Terjadi kesalahan internal server" });
  }
}

/**
 * GET /admin/campaign/:campaignId/pending-withdrawal
 */
async function getPendingWithdrawal(req, res) {
  try {
    const admin = req.admin;
    const { campaignId } = req.params;
    const wd = await reportService.getPendingWithdrawalForReport(campaignId, admin.admin_pura_id);

    if (!wd) {
      return res.status(404).json({ message: "Tidak ada pencairan dana yang perlu dilaporkan saat ini." });
    }

    res.json({ success: true, data: wd });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data pencairan dana" });
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
    res.json({ success: true, data: reports });
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
    const gateway = process.env.PINATA_GATEWAY;

    // Mapping data untuk public — social media style
    res.json(
      reports.map((r) => {
        // Parse media_files dari JSONB
        const mediaFiles = (typeof r.media_files === 'string' ? JSON.parse(r.media_files) : r.media_files) || [];

        return {
          id: r.id,
          campaign_title: r.campaign_title,
          description: r.description || "",
          total_income: r.total_income,
          income_system: r.income_system,
          income_outside: r.income_outside,
          income_peturunan: r.income_peturunan,
          total_expense: r.total_expense,
          metadata_cid: r.metadata_cid,
          metadata_url: r.metadata_cid ? `${gateway}/ipfs/${r.metadata_cid}` : null,
          media: mediaFiles.map(m => ({
            file_name: m.file_name,
            mime_type: m.mime_type,
            ipfs_url: `${gateway || "https://gateway.pinata.cloud"}/ipfs/${m.cid}`,
            cid: m.cid,
          })),
          created_at: r.created_at,
        };
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data laporan publik" });
  }
}

/**
 * GET /adminpura/campaign-reports
 * (Admin Pura - all campaigns)
 */
async function getAllCampaignReportsAdmin(req, res) {
  try {
    const admin = req.admin;
    const reports = await reportService.getAllCampaignReportsAdmin(admin.admin_pura_id);
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil semua data laporan kampanye" });
  }
}

module.exports = {
  uploadReport,
  getCampaignReportsAdmin,
  getCampaignReportsPublic,
  getAllCampaignReportsAdmin,
  getPendingWithdrawal,
};