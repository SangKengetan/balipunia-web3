import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { createCampaign } from "../../services/campaignApi";
import { showError, showSuccess, showInfo } from "../../utils/notification";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    purpose: "UPACARA_ADAT",
    is_onchain_enabled: true,
    is_offchain_enabled: true,
    deadline: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.deadline) {
      showInfo("Informasi", "Deadline wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      await api.post("/admin/campaigns", form);
      showSuccess("Berhasil", "Campaign berhasil dibuat");
      navigate("/admin");

      // Reset form setelah submit
      setForm({
        title: "",
        description: "",
        purpose: "UPACARA_ADAT",
        is_onchain_enabled: true,
        is_offchain_enabled: true,
        deadline: "",
      });

    } catch (err) {
      console.error(err);
      showError("Gagal", err.response?.data?.message || "Gagal membuat campaign", "Silakan periksa data yang Anda masukkan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Buat Campaign Baru</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="text-sm font-medium">Judul Campaign</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Deskripsi</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tujuan Penggunaan Dana</label>
          <select
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="UPACARA_ADAT">Upacara Adat</option>
            <option value="PEMBANGUNAN">Pembangunan</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>

        {/* NEW FIELD DEADLINE */}
        <div>
          <label className="text-sm font-medium">Deadline Campaign</label>
          <input
            type="datetime-local"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Campaign otomatis berubah menjadi EXPIRED jika melewati waktu ini.
          </p>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_onchain_enabled"
              checked={form.is_onchain_enabled}
              onChange={handleChange}
            />
            Donasi On-chain (USDT)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_offchain_enabled"
              checked={form.is_offchain_enabled}
              onChange={handleChange}
            />
            Donasi Off-chain
          </label>
        </div>

        <button
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Buat Campaign"}
        </button>
      </form>
    </div>
  );
}
