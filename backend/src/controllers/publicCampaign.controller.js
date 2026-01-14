const {
  getCampaignDetailFullPublicService,
} = require("../services/campaignDetail.service");

const {
 getScCampaign
} = require('../services/vault.service');

async function getCampaignDetailFullPublic(req, res) {
  const { id } = req.params;

  try {
    const data = await getCampaignDetailFullPublicService({
      campaignId: id,
    });

    res.json(data);
  } catch (err) {
    if (err.message === "CAMPAIGN_NOT_FOUND") {
      return res.status(404).json({ message: "Campaign not found" });
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getPublicSCCampaignDetail(req, res) {
  try {
    const { campaignId } = req.params;

    const data = await getSCCampaignDetail(
      Number(campaignId)
    );

    return res.json(data);
  } catch (err) {
    console.error("[GET SC CAMPAIGN DETAIL ERROR]", err);

    if (err.message === "SC_CAMPAIGN_NOT_FOUND") {
      return res.status(404).json({
        message: "Campaign SC tidak ditemukan",
      });
    }

    return res.status(500).json({
      message: "Gagal mengambil detail campaign SC",
    });
  }
}

module.exports = {
  getCampaignDetailFullPublic, getPublicSCCampaignDetail
};
