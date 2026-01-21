const trusteeService = require("../../services/trustee/withdraw.service");

/**
 * POST /trustee/withdraw/:id/ready
 */
async function readyForVoting(req, res) {
  try {
    const { id } = req.params;

    const wd = await trusteeService.setReadyForVoting(id);

    res.json({
      message: "Withdraw request siap untuk voting",
      withdrawRequestId: wd.id,
      status: wd.status,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * POST /trustee/withdraw/:id/propose
 * proposalId DIDAPAT dari frontend setelah call smart contract
 */
async function startVoting(req, res) {
  try {
    const { id } = req.params;
    const { proposalId } = req.body;

    if (!proposalId) {
      return res.status(400).json({
        message: "proposalId wajib dikirim",
      });
    }

    await trusteeService.markVotingStarted(id, proposalId);

    res.json({
      message: "Voting berhasil dimulai",
      proposalId,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function listWithdrawsForTrustee(req, res) {
  try {
    const withdraws =
      await trusteeService.getAllWithdrawsForTrustee();

    res.json(withdraws);
  } catch (err) {
    console.error("Trustee list withdraw error:", err);
    res.status(500).json({
      message: "Gagal mengambil daftar withdraw untuk trustee",
    });
  }
}

/**
 * GET /trustee/withdraws/:id
 */
async function getWithdrawDetail(req, res) {
  try {
    const { id } = req.params;

    const withdraw =
      await trusteeService.getWithdrawDetailForTrustee(id);

    res.json(withdraw);
  } catch (err) {
    console.error("Trustee withdraw detail error:", err);

    if (err.message === "WITHDRAW_NOT_FOUND") {
      return res.status(404).json({ message: "Withdraw tidak ditemukan" });
    }

    res.status(500).json({
      message: "Gagal mengambil detail withdraw",
    });
  }
}

module.exports = {
  readyForVoting,
  startVoting,
  listWithdrawsForTrustee,
  getWithdrawDetail,
};
