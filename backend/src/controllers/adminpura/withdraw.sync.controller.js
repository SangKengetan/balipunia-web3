// controllers/withdraw.sync.controller.js
const withdrawSyncService = require("../../services/withdraw.sync.service");

async function syncVotingResult(req, res) {
  try {
    const { withdrawRequestId } = req.body;

    if (!withdrawRequestId) {
      return res.status(400).json({
        message: "withdrawRequestId wajib dikirim",
      });
    }

    const result =
      await withdrawSyncService.syncVotingResult(withdrawRequestId);

    res.json({
      message: "Sync voting berhasil",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


module.exports = {
  syncVotingResult,
};
