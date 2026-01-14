const withdrawService = require("../../services/withdraw.service");
const pool = require("../../db/pool");

/**
 * POST /admin/withdraw
 */
async function requestWithdraw(req, res) {
  try {
    const admin = req.admin;
    const { campaign_id, amount, reason } = req.body;
    const file = req.file;

    /* ===============================
       1. Ambil admin_pura.id (FIX)
    =============================== */
    const { rows: adminPuraRows } = await pool.query(
      `
      SELECT id
      FROM admin_pura
      WHERE admin_id = $1
      LIMIT 1
      `,
      [admin.id]
    );

    if (!adminPuraRows.length) {
      return res.status(403).json({
        message: "Admin belum terdaftar sebagai admin pura",
      });
    }

    const adminPuraId = adminPuraRows[0].id;

    /* ===============================
       2. Panggil Service (BENAR)
    =============================== */
    const result = await withdrawService.createOnchainWithdrawRequest({
      adminPuraId,
      campaignId: campaign_id,
      payload: { amount, reason },
      file,
    });

    res.json({
      message: "Permintaan withdraw berhasil diajukan",
      ...result,
    });

  } catch (error) {
    console.error("Withdraw Request Error:", error.message);

    /* ===============================
       ERROR HANDLING (RAPI)
    =============================== */
    const errorMap = {
      CAMPAIGN_NOT_FOUND: [404, "Campaign tidak ditemukan atau bukan milik Anda"],
      ONCHAIN_DISABLED: [400, "Campaign ini tidak mendukung withdraw on-chain"],
      CAMPAIGN_NOT_FINISHED: [400, "Campaign belum selesai"],
      WITHDRAW_ALREADY_REQUESTED: [400, "Withdraw sudah pernah diajukan"],
      CAMPAIGN_NOT_READY_FOR_WITHDRAW: [400, "Campaign belum siap withdraw"],
      ADMIN_WALLET_NOT_FOUND: [400, "Wallet admin pura belum terdaftar"],
      DOCUMENT_REQUIRED: [400, "Dokumen pendukung wajib diunggah"],
    };

    if (error.message.startsWith("BLOCKCHAIN_ERROR")) {
      return res.status(502).json({
        message: "Gagal berkomunikasi dengan blockchain",
        detail: error.message,
      });
    }

    if (errorMap[error.message]) {
      const [status, message] = errorMap[error.message];
      return res.status(status).json({ message });
    }

    res.status(500).json({ message: "Terjadi kesalahan internal server" });
  }
}


/**
 * GET /admin/withdraws
 */
async function listWithdrawRequests(req, res) {
  try {
    const admin = req.admin;
    const withdraws = await withdrawService.getWithdrawRequestsByAdmin(admin.id);
    res.json(withdraws);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil daftar withdraw" });
  }
}

module.exports = {
  requestWithdraw,
  listWithdrawRequests,
};