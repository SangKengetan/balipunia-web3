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
    files: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      // Validasi sederhana ukuran file (misal max 5MB per file)
      const validFiles = selectedFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          error(`Ukuran file ${file.name} terlalu besar (Maks. 5MB)`);
          return false;
        }
        return true;
      });

      setForm(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
    }
  };

  const removeFile = (indexToRemove) => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (form.files.length === 0) {
      error("File bukti laporan (minimal 1) wajib diunggah untuk transparansi");
      return;
    }

    // Validasi: Pengeluaran tidak boleh lebih besar dari pemasukan
    const income = parseFloat(form.total_income) || 0;
    const expense = parseFloat(form.total_expense) || 0;
    if (expense > income) {
      error("Pengeluaran tidak boleh lebih besar dari pemasukan");
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("total_income", form.total_income);
      formData.append("total_expense", form.total_expense);
      
      form.files.forEach(file => {
        formData.append("files", file);
      });

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
             Buat Laporan Keuangan Mandiri
          </h1>
          <p className="text-sm text-gray-500">
            Catat pemasukan/pengeluaran mandiri, termasuk punia bangunan atau hibah dana. Bukti yang diunggah dapat berupa PDF laporan maupun bukti foto pendukung. Data akan disimpan permanen (Smart Contract).
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
                        <label className="block text-sm font-medium text-gray-700 mb-0.5">
                            Total Pemasukan / Kas Saat Ini <span className="text-emerald-600 text-xs font-bold">(Income)</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Termasuk akumulasi saldo kas Anda saat ini.
                        </p>
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

                {/* Live Preview: Kas Saat Ini */}
                {(form.total_income || form.total_expense) && (() => {
                    const inc = parseFloat(form.total_income) || 0;
                    const exp = parseFloat(form.total_expense) || 0;
                    const kas = inc - exp;
                    const isNegative = kas < 0;
                    return (
                        <div className={`mt-4 p-4 rounded-xl border ${isNegative ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs font-semibold ${isNegative ? 'text-red-600' : 'text-blue-600'}`}>
                                        {isNegative ? '⚠️ Pengeluaran melebihi pemasukan/kas!' : '💰 Sisa Kas Akhir (Preview)'}
                                    </p>
                                    <p className={`text-lg font-bold font-mono mt-1 ${isNegative ? 'text-red-700' : 'text-blue-700'}`}>
                                        Rp {new Intl.NumberFormat('id-ID').format(Math.abs(kas))}
                                        {isNegative && <span className="text-xs ml-1">(defisit)</span>}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Selisih pemasukan − pengeluaran
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* --- Section: Upload File --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Bukti Dokumen (PDF Laporan / Foto Bukti) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                    Anda dapat mengunggah lebih dari 1 file sekaligus. Ini bisa berupa rekap PDF, foto nota bangunan, atau bukti mutasi hibah dana.
                </p>
                
                <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 group text-center py-10 px-6 ${
                    form.files.length > 0
                    ? "border-amber-400 bg-amber-50/30" 
                    : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"
                }`}>
                    <input 
                        type="file" 
                        multiple
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        <div className="p-4 bg-gray-50 rounded-full group-hover:bg-white group-hover:scale-110 group-hover:shadow-md transition-all duration-300 text-gray-400 group-hover:text-amber-500">
                             <UploadCloud size={32} />
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-bold text-amber-600 border-b border-amber-600/30">Klik untuk tambah file</span> atau drag and drop
                        </div>
                        <p className="text-xs text-gray-400">PDF, PNG, atau JPG (Maks. 5MB per file)</p>
                    </div>
                </div>

                {/* File List */}
                {form.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {form.files.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate">{f.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors z-20"
                                >
                                    Hapus
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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