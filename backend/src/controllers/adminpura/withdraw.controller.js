const withdrawService = require("../../services/withdraw.service");
const pool = require("../../db/pool");

/**
 * POST /admin/withdraw
 */
async function requestWithdraw(req, res) {
  try {
    const admin = req.admin;
    const {
      campaign_id,
      reason,
      // Fee breakdown fields
      crypto_usdt,
      crypto_usdc,
      crypto_fee_idr,
      fiat_amount_idr,
      fiat_fee_idr,
      total_idr,
      proposal_id,
    } = req.body;
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
       2. Panggil Service (UNIFIED)
    =============================== */
    const result = await withdrawService.createWithdrawRequest({
      adminPuraId,
      campaignId: campaign_id,
      payload: {
        reason,
        crypto_usdt,
        crypto_usdc,
        crypto_fee_idr,
        fiat_amount_idr,
        fiat_fee_idr,
        total_idr,
        proposal_id,
      },
      file,
    });

    res.json({
      message: "Permintaan pencairan dana berhasil diajukan",
      ...result,
    });

  } catch (error) {
    console.error("Withdraw Request Error:", error.message);

    /* ===============================
       ERROR HANDLING (RAPI)
    =============================== */
    const errorMap = {
      CAMPAIGN_NOT_FOUND: [404, "Kegiatan tidak ditemukan atau bukan milik Anda"],
      CAMPAIGN_NOT_REGISTERED_ONCHAIN: [400, "Kegiatan belum terdaftar di blockchain"],
      CAMPAIGN_NOT_FINISHED: [400, "Kegiatan belum melewati batas waktu deadline"],
      WITHDRAW_ALREADY_REQUESTED: [400, "Pencairan dana sudah pernah diajukan atau sedang diproses"],
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

    // 1️⃣ Ambil admin_pura.id berdasarkan admin.id
    const { rows } = await pool.query(
      `
      SELECT id
      FROM admin_pura
      WHERE admin_id = $1
      LIMIT 1
      `,
      [admin.id]
    );

    if (!rows.length) {
      return res.status(403).json({
        message: "Admin belum terdaftar sebagai admin pura",
      });
    }

    const adminPuraId = rows[0].id;

    // 2️⃣ Query withdraw berdasarkan admin_pura_id (BENAR)
    const withdraws =
      await withdrawService.getWithdrawRequestsByAdmin(adminPuraId);

    res.json(withdraws);
  } catch (error) {
    console.error("List Withdraw Error:", error);
    res.status(500).json({ message: "Gagal mengambil daftar withdraw" });
  }
}


/**
 * POST /admin/withdraw/unified-report
 */
async function unifiedWithdrawReport(req, res) {
  try {
    const admin = req.admin;
    const {
      campaign_id,
      reason,
      crypto_usdt,
      crypto_usdc,
      crypto_fee_idr,
      fiat_amount_idr,
      fiat_fee_idr,
      total_idr,
      proposal_id,
      description,
      total_income,
      income_system,
      income_outside,
      income_peturunan,
      total_expense
    } = req.body;
    
    // Multiple files
    const files = req.files;

    const { rows: adminPuraRows } = await pool.query(
      `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
      [admin.id]
    );

    if (!adminPuraRows.length) {
      return res.status(403).json({ message: "Admin belum terdaftar sebagai admin pura" });
    }
    const adminPuraId = adminPuraRows[0].id;

    const result = await withdrawService.createUnifiedWithdrawReport({
      adminPuraId,
      campaignId: campaign_id,
      payload: {
        reason,
        crypto_usdt,
        crypto_usdc,
        crypto_fee_idr,
        fiat_amount_idr,
        fiat_fee_idr,
        total_idr,
        proposal_id,
        description,
        totalIncome: total_income,
        incomeSystem: income_system,
        incomeOutside: income_outside,
        incomePeturunan: income_peturunan,
        totalExpense: total_expense
      },
      files,
    });

    res.json({
      message: "Laporan dan Penarikan Dana berhasil diajukan",
      ...result,
    });

  } catch (error) {
    console.error("Unified Withdraw Report Error:", error.message);
    
    const errorMap = {
      CAMPAIGN_NOT_FOUND: [404, "Kegiatan tidak ditemukan atau bukan milik Anda"],
      CAMPAIGN_NOT_REGISTERED_ONCHAIN: [400, "Kegiatan belum terdaftar di blockchain"],
      CAMPAIGN_NOT_FINISHED: [400, "Kegiatan belum melewati batas waktu deadline"],
      WITHDRAW_ALREADY_REQUESTED: [400, "Pencairan dana sudah pernah diajukan atau sedang diproses"],
      ADMIN_WALLET_NOT_FOUND: [400, "Wallet admin pura belum terdaftar"],
      DOCUMENT_REQUIRED: [400, "Dokumen pendukung (nota/foto) wajib diunggah"],
    };

    if (error.message.startsWith("BLOCKCHAIN_ERROR")) {
      return res.status(502).json({ message: "Gagal berkomunikasi dengan blockchain", detail: error.message });
    }

    if (errorMap[error.message]) {
      const [status, message] = errorMap[error.message];
      return res.status(status).json({ message });
    }

    res.status(500).json({ message: "Terjadi kesalahan internal server" });
  }
}

module.exports = {
  requestWithdraw,
  listWithdrawRequests,
  unifiedWithdrawReport,
};