const express = require("express");
const router = express.Router();
const {
  requestWithdraw, listWithdrawRequests
} = require("../../controllers/adminpura/withdraw.controller");
const { syncWithdraws } = require("../../controllers/adminpura/withdraw.sync.controller");
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
  syncWithdraws
);


module.exports = router;
