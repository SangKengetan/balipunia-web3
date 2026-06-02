import api from "./axios";

/* Dashboard */
export const fetchDashboardSummary = () =>
  api.get("/superadmin/dashboard/summary");

/* Admin CRUD */
export const fetchAdmins = () => api.get("/superadmin/admins");
export const createAdmin = (payload) =>
  api.post("/superadmin/admins", payload);
export const toggleAdmin = (id) =>
  api.patch(`/superadmin/admins/${id}/toggle`);
export const deleteAdmin = (id) =>
  api.delete(`/superadmin/admins/${id}`);

/* Reports */

/**
 * Fetch reports
 * @param {string} status - ALL | PENDING | APPROVED | REJECTED
 */
export const fetchReports = (status = "ALL") => {
  if (!status || status === "ALL") {
    return api.get("/superadmin/reports");
  }

  return api.get("/superadmin/reports", {
    params: { status },
  });
};

export const approveReport = (id) =>
  api.post(`/superadmin/reports/${id}/approve`);
export const rejectReport = (id, note) =>
  api.post(`/superadmin/reports/${id}/reject`, { note });

/* Offchain */
export const fetchOffchainWithdrawals = () =>
  api.get("/superadmin/offchain-withdrawals");
export const updateOffchainStatus = (id, payload) =>
  api.patch(`/superadmin/offchain-withdrawals/${id}/status`, payload);

/* Pencairan Dana (Withdraw Transfers) */
export const fetchWithdrawTransfers = () =>
  api.get("/superadmin/withdraws");
export const completeWithdrawTransfer = (id, formData) =>
  api.post(`/superadmin/withdraws/${id}/transfer`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
