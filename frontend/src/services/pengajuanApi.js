// const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE = "http://localhost:5000";

export async function submitPengajuanPura(formData) {
  const res = await fetch(`${API_BASE}/reports/submit`, {
    method: "POST",
    body: formData,
  });

  let data = null;

  // Coba parse JSON hanya jika ada body
  const text = await res.text();
  if (text) {
    data = JSON.parse(text);
  }

  if (!res.ok) {
    throw new Error(data?.message || "Gagal mengirim pengajuan");
  }

  return data;
}
