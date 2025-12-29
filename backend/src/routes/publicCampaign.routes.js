const express = require("express");
const router = express.Router();
const {
  getPublicCampaigns, getPublicCampaignDetail
} = require("../controllers/publicCampaign.controller");

router.get("/campaigns", getPublicCampaigns);
router.get("/campaigns/:id", getPublicCampaignDetail);

module.exports = router;
