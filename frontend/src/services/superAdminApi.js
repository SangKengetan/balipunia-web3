// const API_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE = "http://localhost:5000";

// 📋 List pengajuan
export async function getPengajuanList(token, status = "PENDING") {
  const res = await fetch(`${API_BASE}/reports?status=${status}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil daftar pengajuan");
  }

  return res.json(); // { total, data }
}

// ✅ Approve
export async function approvePengajuan(id, token) {
  const res = await fetch(`${API_BASE}/reports/${id}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Gagal approve pengajuan");
  }

  return res.json();
}

// ❌ Reject
export async function rejectPengajuan(id, note, token) {
  const res = await fetch(`${API_BASE}/reports/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Gagal reject pengajuan");
  }

  return res.json();
}
