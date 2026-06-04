import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { showError, showSuccess } from "../../utils/notification";

// API backend (sync metadata ke database)
import { syncCampaign } from "../../api/adminPura.api";

// Blockchain service (registrasi ke smart contract)
import {
  createCampaignOnChain,
  CAMPAIGN_TYPE,
} from "../../services/blockchain/onchainCampaign";

export default function CampaignCreate() {
  const navigate = useNavigate();

  // 🔑 State management
  const [mode, setMode] = useState("HYBRID"); // HYBRID | MIDTRANS_ONLY | CRYPTO_ONLY
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    purpose: "UPACARA_ADAT",
    fund_mechanism: "PRA_KEGIATAN",
    deadline: "",
    file: null,
  });

  // =========================
  // SUBMIT HANDLER
  // Semua tipe kegiatan melewati jalur blockchain
  // =========================
  const submit = async () => {
    setIsLoading(true);

    try {
      // 1. Ambil wallet admin dari session
      const rawWallet = sessionStorage.getItem("admin_wallet");
      console.log("RAW admin_wallet:", rawWallet);

      if (!rawWallet) {
        throw new Error("Wallet admin pura tidak ditemukan di sesi ini. Silakan login ulang.");
      }

      const adminWallet = rawWallet.trim();
      console.log("ADMIN WALLET FINAL:", adminWallet);

      if (form.fund_mechanism === "PASCA_KEGIATAN" && !form.deadline) {
        throw new Error("Untuk mekanisme Pasca-Kegiatan, Anda wajib menentukan Batas Waktu Donasi (Deadline).");
      }

      // 2. Generate unique campaign ID
      const campaignId = Date.now();
      
      // 3. Deadline: 0 = open-ended (tidak ada batas waktu)
      let deadlineUnix = 0;
      let deadlineIsoString = null;
      if (form.deadline) {
        const dateObj = new Date(form.deadline);
        deadlineUnix = Math.floor(dateObj.getTime() / 1000);
        // Force the time string to be interpreted as GMT+8 by appending the timezone offset
        deadlineIsoString = `${form.deadline}:00+08:00`;
      }

      // 4. Map mode ke contract enum
      const contractType = CAMPAIGN_TYPE[mode]; // HYBRID=0, MIDTRANS_ONLY=1, CRYPTO_ONLY=2

      // A. Registrasi ke Smart Contract via MetaMask
      const { txHash } = await createCampaignOnChain({
        campaignId,
        campaignType: contractType,
        payoutWallet: adminWallet,
        deadlineUnix,
      });

      // B. Sync metadata ke Database menggunakan FormData
      const formData = new FormData();
      formData.append("id_campaign_onchain", campaignId);
      formData.append("tx_hash", txHash);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("purpose", form.purpose);
      formData.append("fund_mechanism", form.fund_mechanism);
      if (deadlineIsoString) {
        formData.append("deadline", deadlineIsoString);
      }
      formData.append("campaign_type", mode);
      
      if (form.file) {
        formData.append("image", form.file);
      } else {
        throw new Error("Foto atau dokumen pendukung wajib diisi (minimal 1).");
      }

      await syncCampaign(formData);
      showSuccess("Berhasil", "Kegiatan baru berhasil dibuat!");
      navigate("/admin/pura/campaigns");
    } catch (err) {
      console.error(err);
      showError("Gagal Membuat Kegiatan", err.message || "Gagal membuat kegiatan. Cek konsol untuk detail.", "Silakan periksa kembali data yang dimasukkan.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // UI STYLING CONSTANTS
  // =========================
  const inputClass =
    "w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-2.5 outline-none transition-all duration-200";
  
  const labelClass = "block mb-1 text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Buat Kegiatan Baru</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lengkapi detail di bawah untuk menggalang dana Pura.
          </p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          
          {/* FORM INPUTS */}
          <div className="space-y-6">
            
            {/* Judul */}
            <div>
              <label htmlFor="title" className={labelClass}>Nama Kegiatan</label>
              <input
                id="title"
                type="text"
                placeholder="Contoh: Renovasi Tembok Penyengker..."
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* Kategori Kegiatan (Purpose) */}
            <div>
              <label htmlFor="purpose" className={labelClass}>Kategori Kegiatan</label>
              <select
                id="purpose"
                className={inputClass}
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              >
                <option value="UPACARA_ADAT">Upacara Adat</option>
                <option value="PEMBANGUNAN">Pembangunan</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            {/* Jenis Kegiatan */}
            <div>
              <label className={labelClass}>Jenis Kegiatan (Mekanisme Pencairan)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Opsi A: Pra-Kegiatan */}
                <div
                  onClick={() => setForm({ ...form, fund_mechanism: "PRA_KEGIATAN" })}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                    form.fund_mechanism === "PRA_KEGIATAN"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">Pengajuan Dana Awal (Pra-Kegiatan)</span>
                    {form.fund_mechanism === "PRA_KEGIATAN" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Pilih opsi ini untuk kegiatan yang pengumpulan dana punianya dilakukan sebelum kegiatan dimulai, seperti proyek pembangunan atau renovasi pura. Anda perlu mengajukan Rencana Anggaran Biaya (RAB) terlebih dahulu dan wajib membuat laporan bukti setelah kegiatan selesai.
                  </p>
                </div>

                {/* Opsi B: Pasca-Kegiatan */}
                <div
                  onClick={() => setForm({ ...form, fund_mechanism: "PASCA_KEGIATAN" })}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                    form.fund_mechanism === "PASCA_KEGIATAN"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">Lapor & Cairkan Dana (Pasca-Kegiatan)</span>
                    {form.fund_mechanism === "PASCA_KEGIATAN" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Pilih opsi ini untuk kegiatan yang pengumpulan dana punianya dilakukan saat kegiatan berlangsung, seperti penerimaan dana punia ketika upacara Odalan. Anda dapat langsung mengunggah nota pengeluaran asli dan foto kegiatan untuk mencairkan dana sekaligus membuat laporan.
                  </p>
                </div>
              </div>
            </div>

            {/* 🔀 MODE SELECTION (Metode Pembayaran) */}
            <div>
              <label className={labelClass}>Metode Pembayaran yang Diterima</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
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
                    <span className="font-semibold text-gray-800 text-sm">Keduanya (Hybrid)</span>
                    {mode === "HYBRID" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Menerima donasi menggunakan mata uang Rupiah maupun Kripto. Data transparan dan tercatat dengan aman.
                  </p>
                </div>

                {/* Option: Fiat Only */}
                <div
                  onClick={() => setMode("MIDTRANS_ONLY")}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                    mode === "MIDTRANS_ONLY"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">Hanya Rupiah</span>
                    {mode === "MIDTRANS_ONLY" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Hanya menerima donasi Rupiah melalui sistem transfer bank, QRIS, atau e-wallet (GoPay, OVO, dll).
                  </p>
                </div>

                {/* Option: Crypto Only */}
                <div
                  onClick={() => setMode("CRYPTO_ONLY")}
                  className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col gap-2 transition-all ${
                    mode === "CRYPTO_ONLY"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">Hanya Kripto</span>
                    {mode === "CRYPTO_ONLY" && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Hanya menerima donasi menggunakan mata uang digital Kripto (Web3). Data tersimpan penuh secara desentralisasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="description" className={labelClass}>Deskripsi Lengkap</label>
              <textarea
                id="description"
                rows={4}
                placeholder="Ceritakan detail kebutuhan dana..."
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Deadline dengan Helper Text */}
            <div>
              <label htmlFor="deadline" className={labelClass}>
                Batas Waktu Donasi
              </label>
              <div className="relative">
                <input
                  id="deadline"
                  type="datetime-local"
                  className={`${inputClass} cursor-pointer`}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">
                  Kosongkan jika kegiatan bersifat selamanya (tanpa batas waktu). Jika diisi, kegiatan akan ditutup otomatis pada tanggal dan jam tersebut.
                </p>
              </div>
            </div>

            {/* Foto atau Dokumen Pendukung */}
            <div>
              <label htmlFor="file" className={labelClass}>
                Foto atau Dokumen Pendukung (Wajib)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-500 p-1"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP, PDF up to 5MB</p>
                  {form.file && (
                    <p className="text-sm font-medium text-green-600 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {form.file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* UX Alert for Blockchain Registration */}
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800 animate-fade-in">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">Registrasi Blockchain Diperlukan</p>
              <p className="mt-1">
                Semua kegiatan akan diregistrasikan ke Smart Contract di Blockchain.
                Pastikan wallet MetaMask terhubung dan memiliki saldo BNB/koin testnet untuk <strong>Gas Fee</strong>.
                Data on-chain tidak dapat diubah setelah disimpan.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={submit}
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses Transaksi Blockchain...
                </span>
              ) : (
                "Simpan & Publikasikan Kegiatan"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}