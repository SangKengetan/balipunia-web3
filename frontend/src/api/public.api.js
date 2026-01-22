import api from "./axios";

/**
 * Get all pura (public)
 * GET /public/pura
 */
export const fetchPublicPuras = () => api.get("/public/pura");
export const fetchPublicPuraDetail = (id) => {
  return api.get(`/public/pura/${id}`);
};

export const fetchPublicCampaignDetail = (id) =>
  api.get(`/public/campaigns/${id}`);
export const fetchCampaignTimeline = (campaignId) =>
  api.get(`/public/campaigns/${campaignId}/timeline`);
export const fetchOffchainDonations = (campaignId) =>
  api.get(`/public/offchain-transactions`, {
    params: { campaign_id: campaignId },
  });
export const fetchFinancialReportsByPura = (puraId) =>
  api.get(`/public/pura/${puraId}/financial-reports`);

export const fetchPublicSCCampaignDetail = (id_campaign_onchain) =>
  api.get(`/public/campaigns/sc/${id_campaign_onchain}`);