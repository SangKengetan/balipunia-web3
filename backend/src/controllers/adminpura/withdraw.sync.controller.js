const syncService = require("../../services/withdraw.sync.service");

/**
 * POST /admin/withdraws/sync
 * Bisa dipanggil:
 * - saat admin buka dashboard
 * - manual oleh admin
 */
async function syncWithdraws(req, res) {
  const results = await syncService.syncPendingWithdraws();

  res.json({
    message: "Withdraw sync completed",
    updated: results,
  });
}

module.exports = {
  syncWithdraws,
};
