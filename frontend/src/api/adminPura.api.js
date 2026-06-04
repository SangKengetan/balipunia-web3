import api from "./axios"; // axios instance



/* Profile */
export const getProfile = () =>
  api.get("/adminpura/profile");
export const updateProfile = (formData) =>
  api.put("/adminpura/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// list campaign admin pura
export const getMyCampaigns = () =>
  api.get("/adminpura/campaigns");

export const syncCampaign = (formData) =>
  api.post("/adminpura/campaigns/sync", formData);
export const getCampaignDetailFull = (id) =>
  api.get(`/adminpura/campaigns/${id}/detail-full`);

export const getScOnlyCampaigns = () =>
  api.get("/adminpura/campaigns/sc-only");
export const getCampaignById = (id) =>
  api.get(`/adminpura/campaigns/${id}`);
export const requestWithdraw = (formData) =>
  api.post("/adminpura/withdraws", formData);
export const unifiedWithdrawReport = (formData) =>
  api.post("/adminpura/withdraws/unified-report", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getWithdraws = () =>
  api.get("/adminpura/withdraws");
export const syncVotingResult = (withdrawRequestId) =>
  api.post("/adminpura/withdraws/sync", {
    withdrawRequestId,
  });


/* Financial Reports */

/**
 * Fetch all financial reports
 */
export const fetchReports = () =>
  api.get("/adminpura/financereports");

/**
 * Create new financial report
 * @param {FormData} formData - Payload containing title, numbers, and file
 */
export const createReport = (formData) =>
  api.post("/adminpura/financereports", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getDashboardSummary = () =>
  api.get("/adminpura/dashboard/summary");

/**
 * Campaign Reports
 */
export const fetchAllCampaignReports = () =>
  api.get("/adminpura/campaign-reports");

export const fetchPendingWithdrawalForReport = (campaignId) =>
  api.get(`/adminpura/campaign-reports/campaign/${campaignId}/pending-withdrawal`);

export const uploadCampaignReport = (campaignId, formData) =>
  api.post(`/adminpura/campaign-reports/campaign/${campaignId}/report`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });