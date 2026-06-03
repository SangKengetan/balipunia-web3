const leaderboardService = require("../services/leaderboard.service");

async function getGlobalLeaderboard(req, res) {
  try {
    const offchain = await leaderboardService.getOffchainLeaderboard({ limit: 5 });
    const onchain = await leaderboardService.getOnchainLeaderboard({ limit: 5 });
    
    res.status(200).json({ data: { offchain, onchain } });
  } catch (error) {
    console.error("Error getGlobalLeaderboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getCampaignLeaderboard(req, res) {
  try {
    const { campaignId } = req.params;
    const offchain = await leaderboardService.getOffchainLeaderboard({ limit: 5, campaignId });
    const onchain = await leaderboardService.getOnchainLeaderboard({ limit: 5, campaignId });
    
    res.status(200).json({ data: { offchain, onchain } });
  } catch (error) {
    console.error("Error getCampaignLeaderboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getPuraLeaderboard(req, res) {
  try {
    const { puraId } = req.params;
    const offchain = await leaderboardService.getOffchainLeaderboard({ limit: 5, adminPuraId: puraId });
    const onchain = await leaderboardService.getOnchainLeaderboard({ limit: 5, adminPuraId: puraId });
    
    res.status(200).json({ data: { offchain, onchain } });
  } catch (error) {
    console.error("Error getPuraLeaderboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getDonorGlobalRank(req, res) {
  try {
    const donorId = req.donor.id; // from auth middleware
    const rank = await leaderboardService.getDonorGlobalRank(donorId);
    
    res.status(200).json({ data: rank });
  } catch (error) {
    console.error("Error getDonorGlobalRank:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  getGlobalLeaderboard,
  getCampaignLeaderboard,
  getPuraLeaderboard,
  getDonorGlobalRank
};
