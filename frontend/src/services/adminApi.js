const API_BASE = "http://localhost:5000";

// 🔐 1. Request nonce
export async function requestNonce(address) {
  const res = await fetch(`${API_BASE}/admin/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to request nonce");
  }

  return res.json(); // { nonce }
}

// 🔐 2. Verify signature
export async function verifySignature(address, signature) {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Signature verification failed");
  }

  return res.json(); // { token, role, address }
}

// ✅ 3. Ambil data admin dari JWT (UNTUK DASHBOARD)
export async function adminMe(token) {
  const res = await fetch(`${API_BASE}/admin/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json(); // { address, role }
}
