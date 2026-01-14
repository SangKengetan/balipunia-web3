const express = require("express");
const router = express.Router();
const {
  uploadReport, getCampaignReportsAdmin, getCampaignReportsPublic
} = require("../../controllers/adminpura/campaignReport.controller");

const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload"); // multer

router.post(
  "/campaign/:campaignId/report",
  authenticateAdmin,
  upload.single("file"),
  uploadReport
);

router.get(
  "/admin/campaign/:campaignId/reports",
  authenticateAdmin,
  getCampaignReportsAdmin
);

/**
 * PUBLIC – list laporan kampanye
 */
router.get(
  "/campaign/:campaignId/reports",
  getCampaignReportsPublic
);

module.exports = router;
