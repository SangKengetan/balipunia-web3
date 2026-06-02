import api from "./axios";

// 🔹 Ambil semua withdraw untuk trustee
export const getTrusteeWithdraws = () =>
  api.get("/trustee/withdraws");

// 🔹 Detail withdraw
export const getWithdrawDetail = (id) =>
  api.get(`/trustee/withdraws/${id}`);

// 🔹 Set READY_FOR_VOTING
export const setReadyForVoting = (id) =>
  api.post(`/trustee/withdraw/${id}/ready`);

// 🔹 Backend diberi proposalId (setelah MetaMask)
export const notifyProposeVoting = (id, proposalId) =>
  api.post(`/trustee/withdraw/${id}/propose`, { proposalId });

// 🔹 Sync voting result dari blockchain ke database
export const syncWithdrawVoting = (withdrawRequestId) =>
  api.post("/trustee/withdraws/sync", { withdrawRequestId });

