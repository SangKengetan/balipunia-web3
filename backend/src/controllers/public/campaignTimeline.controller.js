const campaignTimelineService = require(
  '../../services/public/campaignTimeline.service'
);

async function getCampaignTimeline(req, res) {
  try {
    const { id } = req.params;
    const timeline = await campaignTimelineService.getCampaignTimeline(id);
    res.json(timeline);
  } catch (err) {
    if (err.message === 'CAMPAIGN_NOT_FOUND') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getCampaignTimeline,
};
