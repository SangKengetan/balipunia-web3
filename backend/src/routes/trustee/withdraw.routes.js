const express = require("express");
const router = express.Router();
const {
  readyForVoting,
  startVoting,
  listWithdrawsForTrustee,
  getWithdrawDetail,
} = require("../../controllers/trustee/withdraw.controller");
const { syncVotingResult } = require("../../controllers/adminpura/withdraw.sync.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");

// NOTE:
// authenticateAdmin + role trustee (wallet based)

router.post(
  "/withdraw/:id/ready",
  authenticateAdmin,
  readyForVoting
);

router.post(
  "/withdraw/:id/propose",
  authenticateAdmin,
  startVoting
);

router.get(
  "/withdraws",
  authenticateAdmin,
  listWithdrawsForTrustee
);

router.get(
  "/withdraws/:id",
  authenticateAdmin,
  getWithdrawDetail
);

router.post(
  "/withdraws/sync",
  authenticateAdmin,
  syncVotingResult
);

module.exports = router;
