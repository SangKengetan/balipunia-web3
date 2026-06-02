const superAdminWithdrawService = require("../../services/superadmin/withdraw.service");
const { uploadToIPFS } = require("../../services/ipfsService");

/**
 * GET /superadmin/withdraws
 * List semua withdraw requests (prioritas: PENDING_TRANSFER)
 */
async function listWithdrawTransfers(req, res) {
  try {
    const rows = await superAdminWithdrawService.getPendingTransfers();

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("SuperAdmin list withdraws error:", error);
    res.status(500).json({
      message: "Gagal mengambil daftar pencairan dana",
    });
  }
}

/**
 * POST /superadmin/withdraws/:id/transfer
 * Upload bukti transfer dan selesaikan pencairan
 */
async function completeTransfer(req, res) {
  try {
    const withdrawRequestId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Bukti transfer (struk) wajib diunggah",
      });
    }

    // Upload bukti transfer ke IPFS
    const transferProofCid = await uploadToIPFS(file);

    const result = await superAdminWithdrawService.completeTransfer({
      withdrawRequestId,
      transferProofCid,
      adminId: req.admin.id,
    });

    res.json({
      message: "Transfer berhasil diselesaikan. Status pencairan: COMPLETED.",
      ...result,
    });
  } catch (error) {
    console.error("SuperAdmin complete transfer error:", error.message);

    const errorMap = {
      WITHDRAW_NOT_FOUND: [404, "Permintaan pencairan tidak ditemukan"],
      WITHDRAW_NOT_PENDING_TRANSFER: [
        400,
        "Pencairan ini belum siap untuk ditransfer (status bukan PENDING_TRANSFER)",
      ],
    };

    if (errorMap[error.message]) {
      const [status, message] = errorMap[error.message];
      return res.status(status).json({ message });
    }

    res.status(500).json({
      message: "Gagal menyelesaikan transfer",
    });
  }
}

module.exports = {
  listWithdrawTransfers,
  completeTransfer,
};
