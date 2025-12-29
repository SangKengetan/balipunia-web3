const API_BASE = "http://localhost:5000";

export async function getReports(token, status) {
  const url = status
    ? `${API_BASE}/reports?status=${status}`
    : `${API_BASE}/reports`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal mengambil data laporan");
  }

  return res.json(); // { total, data }
}

export async function approveReport(id, token) {
  const res = await fetch(`${API_BASE}/reports/${id}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Gagal approve");
  }

  return res.json();
}

export async function rejectReport(id, note, token) {
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
    throw new Error(err.message || "Gagal reject");
  }

  return res.json();
}
