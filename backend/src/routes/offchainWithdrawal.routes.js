const express = require("express");
const router = express.Router();

const { authenticateAdmin } = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/requireRole");

const {
  getOffchainWithdrawals,
  updateOffchainWithdrawalStatus,
} = require("../controllers/offchainWithdrawal.controller");

router.use(authenticateAdmin, requireRole("SUPER_ADMIN"));

router.get("/", getOffchainWithdrawals);
router.patch("/:id/status", updateOffchainWithdrawalStatus);

module.exports = router;
