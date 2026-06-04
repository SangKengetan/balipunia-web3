const express = require("express");
const router = express.Router();
const {
  requestWithdraw, listWithdrawRequests, unifiedWithdrawReport
} = require("../../controllers/adminpura/withdraw.controller");
const { syncVotingResult } = require("../../controllers/adminpura/withdraw.sync.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload");;

router.post(
  "/",
  authenticateAdmin,
  upload.single("document"), // ← WAJIB
  requestWithdraw
);
router.get(
  "/",
  authenticateAdmin,
  listWithdrawRequests
);
router.post(
  "/sync",
  authenticateAdmin,
  syncVotingResult
);
router.post(
  "/unified-report",
  authenticateAdmin,
  upload.array("media", 5),
  unifiedWithdrawReport
);


module.exports = router;
