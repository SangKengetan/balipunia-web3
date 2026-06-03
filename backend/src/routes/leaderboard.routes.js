const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboard.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/global", leaderboardController.getGlobalLeaderboard);
router.get("/campaign/:campaignId", leaderboardController.getCampaignLeaderboard);
router.get("/pura/:puraId", leaderboardController.getPuraLeaderboard);

// Protected endpoint for specific donor rank
router.get("/donor/rank", authMiddleware.authenticateDonor, leaderboardController.getDonorGlobalRank);

module.exports = router;
