import axios from "axios";

const campaignApi = axios.create({
  baseURL: "http://localhost:5000",
});

export async function createBankTransferPayment(payload) {
  return campaignApi.post("/api/payments/bank-transfer", payload);
}

export const getOffchainDonations = (campaignId) =>
  campaignApi.get(`/api/payments/offchain-history`, {
    params: { campaignId },
  });

