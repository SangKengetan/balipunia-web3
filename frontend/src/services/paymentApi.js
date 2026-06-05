import axios from "axios";

const campaignApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add request interceptor to attach donor token
campaignApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("donor_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export async function createBankTransferPayment(payload) {
  return campaignApi.post("/api/payments/bank-transfer", payload);
}

export async function createEwalletPayment(payload) {
  return campaignApi.post("/api/payments/ewallet", payload);
}

export const getOffchainDonations = (campaignId) =>
  campaignApi.get(`/api/payments/offchain-history`, {
    params: { campaignId },
  });

