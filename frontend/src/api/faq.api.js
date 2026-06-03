import axios from "axios";

const API_URL = "http://localhost:5000/api/faqs";

// Helper for admin token
const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchFaqs = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getFaqById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createFaq = async (data) => {
  const res = await axios.post(API_URL, data, getAuthHeaders());
  return res.data;
};

export const updateFaq = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
  return res.data;
};

export const deleteFaq = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  return res.data;
};
