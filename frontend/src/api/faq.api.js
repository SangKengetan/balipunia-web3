import api from "./axios";

export const fetchFaqs = async () => {
  const res = await api.get("/api/faqs");
  return res.data;
};

export const getFaqById = async (id) => {
  const res = await api.get(`/api/faqs/${id}`);
  return res.data;
};

export const createFaq = async (data) => {
  const res = await api.post("/api/faqs", data);
  return res.data;
};

export const updateFaq = async (id, data) => {
  const res = await api.put(`/api/faqs/${id}`, data);
  return res.data;
};

export const deleteFaq = async (id) => {
  const res = await api.delete(`/api/faqs/${id}`);
  return res.data;
};
