const { get } = require('http');
const campaignService = require('../../services/public/campaignDetail.service');
const campaignTimelineService = require('../../services/public/campaignTimeline.service');
const {getScCampaign} = require('../../services/vault.service');

async function getHybridCampaignDetail(req, res) {
  try {
    const { id } = req.params;
    const data = await campaignService.getHybridCampaignDetail(id);
    const timeline = await campaignTimelineService.getCampaignTimeline(id);
    res.json({ ...data, timeline });
  } catch (err) {
    if (err.message === 'CAMPAIGN_NOT_FOUND') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (err.message === 'FORBIDDEN_SC_ONLY') {
      return res.status(403).json({ message: 'SC-ONLY campaign has no DB detail page' });
    }
    res.status(500).json({ message: err.message });
  }
}

// controller/public/campaign.controller.js

async function getPublicSCCampaignDetail(req, res) {
  try {
    console.log("📥 Params:", req.params);

    const rawId = req.params.id_campaign_onchain ?? req.params.id;

    if (!rawId || !/^\d+$/.test(rawId)) {
      return res.status(400).json({
        message: "ID Campaign on-chain tidak valid",
        received: rawId,
      });
    }

    const campaignId = BigInt(rawId);
    console.log("🆔 Campaign ID:", campaignId.toString());

    const data = await getScCampaign(campaignId);

    if (!data.exists) {
      return res.status(404).json({
        message: "Campaign SC tidak ditemukan di blockchain",
      });
    }

    return res.json({
      source: "blockchain",
      data: {
        ...data,
        campaignId: campaignId.toString(), // FE aman
      },
    });

  } catch (err) {
    console.error("❌ ERROR getPublicSCCampaignDetail:", err);
    return res.status(500).json({
      message: "Gagal mengambil campaign dari blockchain",
    });
  }
}



module.exports = {
  getHybridCampaignDetail, getPublicSCCampaignDetail
};
