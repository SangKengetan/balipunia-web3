import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadCampaignReport, fetchPendingWithdrawalForReport } from "../../api/adminPura.api";
import useToast from "../../hooks/useToast";
import {
  ArrowLeft,
  UploadCloud,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  X,
  FileText
} from "lucide-react";

export default function CreateCampaignReport() {
  const { id } = useParams();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Withdrawal data from system
  const [systemIncome, setSystemIncome] = useState(0);

  const [form, setForm] = useState({
    description: "",
    manual_income: "",
    total_expense: "",
  });

  // Array of { file: File, preview: string (URL) }
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    const fetchPendingWD = async () => {
      try {
        const res = await fetchPendingWithdrawalForReport(id);
        const data = res?.data?.data || res?.data;
        if (data && data.total_idr) {
          setSystemIncome(Number(data.total_idr));
        }
      } catch (err) {
        error(err.response?.data?.message || "Gagal mengambil data pencairan sistem");
        // Jika tidak ada pencairan, sebaiknya diarahkan kembali
        setTimeout(() => navigate(-1), 2000);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchPendingWD();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);

    // Validasi total file (max 10)
    if (mediaFiles.length + newFiles.length > 10) {
      error("Maksimal 10 file per laporan");
      return;
    }

    // Validasi ukuran per file (max 5MB)
    for (const f of newFiles) {
      if (f.size > 5 * 1024 * 1024) {
        error(`File "${f.name}" terlalu besar (Maks. 5MB per file)`);
        return;
      }
    }

    const withPreviews = newFiles.map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setMediaFiles(prev => [...prev, ...withPreviews]);

    // Reset input agar bisa re-select file yang sama
    e.target.value = "";
  };

  const removeFile = (index) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      // Revoke URL object agar tidak memory leak
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (mediaFiles.length === 0) {
      error("Minimal satu foto atau dokumen wajib diunggah untuk transparansi");
      return;
    }

    if (!form.description.trim()) {
      error("Ceritakan bagaimana dana digunakan (deskripsi wajib diisi)");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("description", form.description);

      // Calculate total income = systemIncome + manualIncome
      const totalIncome = systemIncome + (Number(form.manual_income) || 0);
      formData.append("total_income", totalIncome);
      formData.append("total_expense", form.total_expense);

      // Append semua file ke FormData
      for (const item of mediaFiles) {
        formData.append("files", item.file);
      }

      await uploadCampaignReport(id, formData);

      success("Laporan kegiatan berhasil dipublikasi & di-hash ke IPFS 🎉");

      setTimeout(() => {
        navigate("/admin/pura/financereports");
      }, 1500);

    } catch (e) {
      console.error(e);
      error(e.response?.data?.message || e.message || "Gagal membuat laporan");
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 font-sans">

      {/* 1. Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-amber-600 transition-colors text-gray-500 shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Buat Laporan Kegiatan
          </h1>
          <p className="text-sm text-gray-500">
            Ceritakan & dokumentasikan penggunaan dana kegiatan ini. Data akan disimpan permanen di IPFS & Blockchain.
          </p>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Progress Indicator */}
        <div className="h-1.5 w-full bg-gray-100">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 w-1/3 rounded-r-full transition-all"></div>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-8">

            {/* --- Section 1: Cerita / Deskripsi --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <FileText size={18} className="text-amber-500" />
                <h2>Cerita Penggunaan Dana</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi Kegiatan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Ceritakan apa yang telah dilakukan dengan dana punia ini. Misalnya: pengerjaan renovasi, pembelian material, upacara yang telah dilaksanakan..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-gray-400 resize-none leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1">Tulis sejelas mungkin agar masyarakat memahami penggunaan dana.</p>
              </div>
            </div>

            {/* --- Section 2: Upload Foto/Dokumen (Multi) --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <ImagePlus size={18} className="text-amber-500" />
                <h2>Dokumentasi Foto & Bukti</h2>
              </div>

              {/* Drop Zone */}
              <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 group text-center py-8 px-6 ${mediaFiles.length > 0
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"
                }`}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFilesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="p-3 bg-gray-50 rounded-full group-hover:bg-white group-hover:scale-110 group-hover:shadow-md transition-all duration-300 text-gray-400 group-hover:text-amber-500">
                    <UploadCloud size={28} />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-amber-600 border-b border-amber-600/30">Klik untuk upload</span> atau drag and drop
                  </div>
                  <p className="text-xs text-gray-400">Gambar (JPG, PNG) atau PDF — Maks. 5MB per file, 10 file total</p>
                </div>
              </div>

              {/* Preview Grid */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {mediaFiles.map((item, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">

                      {/* Preview Image or Placeholder */}
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <FileText size={28} />
                          <span className="text-[10px] mt-1 px-1 truncate max-w-full">{item.file.name}</span>
                        </div>
                      )}

                      {/* Remove Button (Overlay) */}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>

                      {/* Index Badge */}
                      <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mediaFiles.length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-green-500" />
                  {mediaFiles.length} file siap diunggah
                </p>
              )}
            </div>

            {/* --- Section 3: Financial Data --- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <AlertCircle size={18} className="text-amber-500" />
                <h2>Rincian Keuangan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Income Input (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dana Dicairkan (Sistem) <span className="text-emerald-600 text-xs font-bold">(Income)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold text-sm">Rp</span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={new Intl.NumberFormat('id-ID').format(systemIncome)}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 py-3 text-sm outline-none font-mono font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Otomatis diambil dari riwayat pencairan dana kampanye.</p>
                </div>

                {/* Manual Income Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dana Tambahan (Luar Sistem) <span className="text-emerald-600 text-xs font-bold">(Income)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold text-sm group-focus-within:text-emerald-600">Rp</span>
                    </div>
                    <input
                      type="number"
                      name="manual_income"
                      min="0"
                      value={form.manual_income}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-medium text-gray-700"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Isi jika ada sumbangan/donasi tunai di luar sistem Balipunia.</p>
                </div>

                {/* Expense Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Total Pengeluaran <span className="text-rose-600 text-xs font-bold">(Expense)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold text-sm group-focus-within:text-rose-600">Rp</span>
                    </div>
                    <input
                      type="number"
                      name="total_expense"
                      required
                      min="0"
                      value={form.total_expense}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-mono font-medium text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Info Box --- */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-1 text-blue-500 mt-0.5">
                <AlertCircle size={16} />
              </div>
              <div className="text-xs text-blue-700 leading-relaxed">
                <strong>Catatan Transparansi:</strong> Semua foto dan data keuangan di atas akan dibungkus menjadi satu file <strong>JSON Metadata</strong>, diunggah ke <strong>IPFS</strong>, dan hash-nya akan dicatat secara permanen di <strong>Blockchain</strong>. Data ini tidak dapat diubah atau dihapus setelah dipublikasi.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Mengupload ke IPFS...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Publikasi Laporan
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
