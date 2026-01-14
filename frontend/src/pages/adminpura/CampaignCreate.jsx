import { useState } from "react";
import { createCampaign, createScOnlyCampaign } from "../../api/adminPura.api"; // Sesuaikan path
import { useNavigate } from "react-router-dom";

export default function CampaignCreate() {
  const navigate = useNavigate();

  // 🔑 State management
  const [mode, setMode] = useState("HYBRID"); // HYBRID | SC_ONLY
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    purpose: "UPACARA_ADAT",
    deadline: "",
  });

  // Handle submit
  const submit = async () => {
    setIsLoading(true);
    try {
      if (mode === "SC_ONLY") {
        await createScOnlyCampaign(form);
      } else {
        await createCampaign(form);
      }
      navigate("/admin/pura/campaigns");
    } catch (error) {
      console.error("Gagal membuat campaign", error);
      // Tambahkan toast error disini jika ada
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable Input Class untuk konsistensi UI
  const inputClass =
    "w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-2.5 outline-none transition-all duration-200";
  
  const labelClass = "block mb-1 text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Container Card - Mengikuti gaya Login/Register */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Buat Campaign Baru</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lengkapi detail di bawah untuk menggalang dana Pura atau Yayasan.
          </p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          
          {/* 🔀 MODE SELECTION (UX Improvement: Visual Cards) */}
          <div>
            <label className={labelClass}>Metode Penyimpanan (Storage Mode)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Option: Hybrid */}
              <div
                onClick={() => setMode("HYBRID")}
                className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                  mode === "HYBRID"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Hybrid</span>
                  {mode === "HYBRID" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                </div>
                <p className="text-xs text-gray-500">
                  Data disimpan di Database & Opsional ke Blockchain. Lebih cepat & hemat gas fee.
                </p>
              </div>

              {/* Option: SC Only */}
              <div
                onClick={() => setMode("SC_ONLY")}
                className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                  mode === "SC_ONLY"
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">SC-Only (Web3)</span>
                  {mode === "SC_ONLY" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                </div>
                <p className="text-xs text-gray-500">
                  Full On-Chain. Transparansi maksimal, namun membutuhkan tanda tangan wallet.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* FORM INPUTS */}
          <div className="space-y-4">
            
            {/* Judul */}
            <div>
              <label htmlFor="title" className={labelClass}>Nama Campaign / Kegiatan</label>
              <input
                id="title"
                type="text"
                placeholder="Contoh: Renovasi Tembok Penyengker..."
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="purpose" className={labelClass}>Tujuan Penggalangan</label>
              <select
                id="purpose"
                className={inputClass}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              >
                <option value="UPACARA_ADAT">Upacara Adat</option>
                <option value="PEMBANGUNAN">Pembangunan & Renovasi</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="description" className={labelClass}>Deskripsi Lengkap</label>
              <textarea
                id="description"
                rows={4}
                placeholder="Ceritakan detail kebutuhan dana, latar belakang, dan rencana penggunaan..."
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* 📅 DEADLINE INPUT (Fokus Utama) */}
            <div>
              <label htmlFor="deadline" className={labelClass}>
                Batas Waktu Donasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="deadline"
                  type="date"
                  className={`${inputClass} cursor-pointer`}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">
                  Campaign akan ditutup secara otomatis pada tanggal ini pukul 23:59 WITA.
                </p>
              </div>
            </div>
          </div>

          {/* UX Alert / Hint */}
          {mode === "SC_ONLY" && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold">Perhatian Mode On-Chain</p>
                <p>
                  Campaign akan diregistrasi langsung ke Blockchain. Pastikan Anda memiliki saldo koin untuk Gas Fee. Proses tidak dapat dibatalkan atau diedit dengan mudah.
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={submit}
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Simpan & Publikasikan Campaign"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}