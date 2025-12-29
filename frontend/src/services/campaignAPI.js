import axios from "axios";

/**
 * Axios instance khusus Campaign API
 */
const campaignApi = axios.create({
  baseURL: "http://localhost:5000",
});

export async function getPublicCampaigns() {
  const res = await campaignApi.get(`/public/campaigns`);
  return res.data;
}

export async function getPublicCampaignDetail(id) {
  const res = await campaignApi.get(`/public/campaigns/${id}`);
  return res.data;
}



/**
 * Interceptor: inject admin token otomatis
 */
campaignApi.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   ADMIN CAMPAIGN SERVICES
========================= */

/**
 * Create campaign (Admin Pura)
 */
export async function createCampaign(payload) {
  const res = await campaignApi.post("/campaigns", payload);
  return res.data;
}

/**
 * Get campaigns milik admin
 */
export async function getMyCampaigns() {
  const res = await campaignApi.get("/campaigns");
  return res.data;
}

/**
 * Get detail campaign (admin)
 */
export async function getCampaignById(id) {
  const res = await campaignApi.get(`/campaigns/${id}`);
  return res.data;
}

/**
 * Update campaign (admin)
 */
export async function updateCampaign(id, payload) {
  const res = await campaignApi.put(`/campaigns/${id}`, payload);
  return res.data;
}

export default campaignApi;
