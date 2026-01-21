const { get } = require('http');
const campaignService = require('../../services/public/campaignDetail.service');
const campaignTimelineService = require('../../services/public/campaignTimeline.service');

/**
 * PUBLIC: Detail Campaign (HYBRID & SC-ONLY)
 * =========================================
 * Param  : id (DB campaign id)
 * Source : DB (metadata) + Blockchain (onchain)
 */
async function getPublicCampaignDetail(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID campaign wajib diisi" });
    }

    /**
     * 1) Tentukan tipe campaign (ringan)
     */
    const { campaign_type } = await campaignService.getCampaignType(id);
    // ^ helper kecil di service (lihat catatan di bawah)

    /**
     * 2) Ambil detail sesuai tipe
     */
    let data;
    if (campaign_type === 'SC-ONLY') {
      // DB + Onchain, TANPA offchain
      data = await campaignService.getScCampaignDetail(id);
    } else {
      // Hybrid (DB + Onchain + Offchain)
      data = await campaignService.getHybridCampaignDetail(id);
    }

    /**
     * 3) Timeline (DB-based, aman)
     */
    let timeline = [];
    try {
      timeline = await campaignTimelineService.getCampaignTimeline(id);
    } catch (e) {
      // timeline opsional, jangan bikin endpoint gagal
      timeline = [];
    }

    /**
     * 4) RESPONSE KONSISTEN
     */
    return res.json({
      source: "public",
      campaign: data.campaign,
      onchain: data.onchain,
      offchain: data.offchain ?? null,
      timeline,
    });

  } catch (err) {
    console.error("❌ ERROR getPublicCampaignDetail:", err.message);

    // === ERROR MAPPING JELAS ===
    if (err.message === 'CAMPAIGN_NOT_FOUND') {
      return res.status(404).json({ message: 'Campaign tidak ditemukan' });
    }

    if (err.message === 'FORBIDDEN_SC_ONLY') {
      return res.status(403).json({ message: 'Campaign SC-ONLY tidak mendukung halaman Hybrid' });
    }

    if (err.message === 'FORBIDDEN_NON_SC_ONLY') {
      return res.status(403).json({ message: 'Campaign bukan SC-ONLY' });
    }

    if (err.message === 'SC_NOT_REGISTERED_ONCHAIN') {
      return res.status(409).json({
        message: 'Campaign SC belum terdaftar di blockchain',
      });
    }

    return res.status(500).json({
      message: 'Gagal mengambil detail campaign',
    });
  }
}

module.exports = {
  getPublicCampaignDetail,
};
