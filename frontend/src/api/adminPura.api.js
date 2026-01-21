import api from "./axios"; // axios instance

/* Profile */
export const getProfile = () =>
  api.get("/adminpura/profile");
export const updateProfile = (payload) =>
  api.put("/adminpura/profile", payload);

// list campaign admin pura
export const getMyCampaigns = () =>
  api.get("/adminpura/campaigns");

export const createCampaign = (payload) =>
  api.post("/adminpura/campaigns", payload);
export const getCampaignDetailFull = (id) =>
  api.get(`/adminpura/campaign/${id}/detail-full`);
export const syncScOnlyCampaign = (payload) =>
  api.post("/adminpura/campaigns/sync-sc-only", payload);

export const getScOnlyCampaigns = () =>
  api.get("/adminpura/campaigns/sc-only");
export const getCampaignById = (id) =>
  api.get(`/adminpura/campaigns/${id}`);
export const requestWithdraw = (formData) =>
  api.post("/adminpura/withdraws", formData);

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