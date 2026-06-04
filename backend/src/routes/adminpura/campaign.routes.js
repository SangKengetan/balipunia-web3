const express = require("express");
const router = express.Router();
const {
  syncCampaign, getCampaignDetailFull, getMyCampaigns, getCampaignById
} = require("../../controllers/adminpura/campaign.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");

// Sync kegiatan dari blockchain ke database (semua tipe)
const upload = require("../../middlewares/upload.middleware");
router.post("/sync", authenticateAdmin, upload.single("image"), syncCampaign);

router.get("/:id/detail-full", authenticateAdmin, getCampaignDetailFull);
router.get("/:id", authenticateAdmin, getCampaignById);
router.get("/", authenticateAdmin, getMyCampaigns);

module.exports = router;
