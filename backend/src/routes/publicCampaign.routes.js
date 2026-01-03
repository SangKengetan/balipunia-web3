const express = require("express");
const router = express.Router();
const {
  getPublicCampaigns, getPublicCampaignDetail, getCampaignDonations
} = require("../controllers/publicCampaign.controller");

router.get("/campaigns", getPublicCampaigns);
router.get("/campaigns/:id", getPublicCampaignDetail);
router.get("/:id/donations", getCampaignDonations);


module.exports = router;
