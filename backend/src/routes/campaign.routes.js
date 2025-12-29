const express = require("express");
const router = express.Router();

const { createCampaign, getMyCampaigns, getCampaignById, updateCampaign } = require("../controllers/campaign.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/requireRole");


router.post(
  "/",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  createCampaign
);

router.get(
  "/",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  getMyCampaigns
);

router.get(
  "/:id",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  getCampaignById
);

router.put(
  "/:id",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  updateCampaign
);


module.exports = router;
