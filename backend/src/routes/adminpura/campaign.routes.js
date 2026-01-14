const express = require("express");
const router = express.Router();
const {
  createCampaign,
  createScOnlyCampaign, getCampaignDetailFull, getMyCampaigns, getCampaignById
} = require("../../controllers/adminpura/campaign.controller");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");

router.post("/", authenticateAdmin, createCampaign);
router.post("/sc-only", authenticateAdmin, createScOnlyCampaign);
router.get(
  "/campaign/:id/detail-full",
  authenticateAdmin,
  getCampaignDetailFull
);
router.get("/:id", authenticateAdmin, getCampaignById);
router.get("/", authenticateAdmin, getMyCampaigns);


module.exports = router;
