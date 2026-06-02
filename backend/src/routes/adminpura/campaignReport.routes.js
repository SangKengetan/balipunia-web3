const express = require("express");
const router = express.Router();
const {
  uploadReport,
  getCampaignReportsAdmin,
  getAllCampaignReportsAdmin,
  getCampaignReportsPublic,
  getPendingWithdrawal,
} = require("../../controllers/adminpura/campaignReport.controller");

const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload"); // multer

router.post(
  "/campaign/:campaignId/report",
  authenticateAdmin,
  upload.array("files", 10),  // Max 10 files per laporan
  uploadReport
);

router.get(
  "/admin/campaign/:campaignId/reports",
  authenticateAdmin,
  getCampaignReportsAdmin
);

router.get(
  "/",
  authenticateAdmin,
  getAllCampaignReportsAdmin
);

/**
 * PUBLIC – list laporan kampanye
 */
router.get(
  "/campaign/:campaignId/reports",
  getCampaignReportsPublic
);

router.get(
  "/campaign/:campaignId/pending-withdrawal",
  authenticateAdmin,
  getPendingWithdrawal
);

module.exports = router;
