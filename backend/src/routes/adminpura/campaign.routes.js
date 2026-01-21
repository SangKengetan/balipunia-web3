const express = require("express");
const router = express.Router();
const {
  createCampaign,
  createScOnlyCampaign, getCampaignDetailFull, getMyCampaigns, getCampaignById, syncScOnlyCampaign
} = require("../../controllers/adminpura/campaign.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");

router.post("/", authenticateAdmin, createCampaign);
// router.post("/sc-only", authenticateAdmin, createScOnlyCampaign);
router.get("/campaign/:id/detail-full", authenticateAdmin, getCampaignDetailFull);
router.get("/:id", authenticateAdmin, getCampaignById);
router.get("/", authenticateAdmin, getMyCampaigns);
router.post("/sync-sc-only", authenticateAdmin, syncScOnlyCampaign);


module.exports = router;
