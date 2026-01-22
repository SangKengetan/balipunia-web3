import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReport } from "../../api/adminPura.api";
import useToast from "../../hooks/useToast";
import { 
  ArrowLeft, 
  UploadCloud, 
  Save, 
  Loader2, 
  FileText, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function CreateFinanceReport() {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState(""); 
  
  const [form, setForm] = useState({
    title: "",
    total_income: "",
    total_expense: "",
    file: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi sederhana ukuran file (misal max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error("Ukuran file terlalu besar (Maks. 5MB)");
        return;
      }
      setForm(prev => ({ ...prev, file: file }));
      setFileName(file.name);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.file) {
      error("File bukti laporan wajib diunggah untuk transparansi");
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("total_income", form.total_income);
      formData.append("total_expense", form.total_expense);
      formData.append("file", form.file);

      await createReport(formData);
      
      success("Laporan berhasil diterbitkan & di-anchor ke blockchain");
      
      setTimeout(() => {
        navigate("/admin/pura/financereports"); 
      }, 1500);

    } catch (e) {
      console.error(e);
      error(e.message || "Gagal membuat laporan");
      setSubmitting(false);
    }
  };

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
             Buat Laporan Baru
          </h1>
          <p className="text-sm text-gray-500">
            Data akan disimpan permanen menggunakan IPFS & Smart Contract.
          </p>
        </div>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Progress Indicator (Visual Decoration) */}
        <div className="h-1 w-full bg-gray-100">
            <div className="h-full bg-amber-500 w-1/3 rounded-r-full"></div>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            
            {/* --- Section: Detail Laporan --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                    <FileText size={18} className="text-amber-500"/>
                    <h2>Detail Umum</h2>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Judul Laporan <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="title" 
                        required
                        value={form.title} 
                        onChange={handleInputChange}
                        placeholder="Contoh: Laporan Keuangan Piodalan - Januari 2026"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* --- Section: Financial Data --- */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                    <AlertCircle size={18} className="text-amber-500"/>
                    <h2>Data Keuangan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Total Pemasukan <span className="text-emerald-600 text-xs font-bold">(Income)</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-400 font-bold text-sm group-focus-within:text-emerald-600">Rp</span>
                            </div>
                            <input 
                                type="number" 
                                name="total_income" 
                                required
                                min="0"
                                value={form.total_income} 
                                onChange={handleInputChange}
                                placeholder="0"
                                className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-medium text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Expense Input */}
                    <div>
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

            {/* --- Section: Upload File --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Bukti Dokumen (PDF/Gambar) <span className="text-red-500">*</span>
                </label>
                
                <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 group text-center py-10 px-6 ${
                    fileName 
                    ? "border-amber-400 bg-amber-50/30" 
                    : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"
                }`}>
                    <input 
                        type="file" 
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        {fileName ? (
                            // State: File Selected
                            <>
                                <div className="p-4 bg-white rounded-full shadow-sm text-green-500 border border-green-100">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{fileName}</p>
                                    <p className="text-xs text-amber-600 mt-1">Klik untuk mengganti file</p>
                                </div>
                            </>
                        ) : (
                            // State: Empty
                            <>
                                <div className="p-4 bg-gray-50 rounded-full group-hover:bg-white group-hover:scale-110 group-hover:shadow-md transition-all duration-300 text-gray-400 group-hover:text-amber-500">
                                     <UploadCloud size={32} />
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-bold text-amber-600 border-b border-amber-600/30">Klik untuk upload</span> atau drag and drop
                                </div>
                                <p className="text-xs text-gray-400">PDF, PNG, atau JPG (Maks. 5MB)</p>
                            </>
                        )}
                    </div>
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
                            Memproses Blockchain...
                        </>
                    ) : (
                        <>
                            <Save size={18} /> Publish Laporan
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