import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Asumsi pakai React Router
import { createReport } from "../../api/adminPura.api";
import useToast from "../../hooks/useToast";

// Icons
const ArrowLeftIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const CloudUploadIcon = () => (<svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const SaveIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>);

export default function CreateFinanceReport() {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState(""); // Untuk preview nama file
  
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
      setForm(prev => ({ ...prev, file: file }));
      setFileName(file.name);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.file) {
      error("File bukti laporan wajib diunggah");
      return;
    }

    try {
      setSubmitting(true);
      
      // Bungkus dalam FormData karena ada file upload
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("total_income", form.total_income);
      formData.append("total_expense", form.total_expense);
      formData.append("file", form.file);

      // Consume API createReport
      await createReport(formData);
      
      success("Laporan berhasil diterbitkan & di-anchor ke blockchain");
      
      // Redirect kembali ke list setelah sukses (delay dikit biar toast terbaca)
      setTimeout(() => {
        navigate("/admin/pura/financereports"); 
      }, 1000);

    } catch (e) {
      error(e.message || "Gagal membuat laporan");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in-enter py-6">
      
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
             Buat Laporan Baru
          </h1>
          <p className="text-sm text-slate-500">
            Data akan disimpan permanen menggunakan IPFS & Smart Contract.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            
            {/* Judul */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Judul Laporan
                </label>
                <input 
                    type="text" 
                    name="title" 
                    required
                    value={form.title} 
                    onChange={handleInputChange}
                    placeholder="Contoh: Laporan Keuangan Pura Dalem - Januari 2026"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Pemasukan (Income)
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-medium text-sm group-focus-within:text-indigo-500">Rp</span>
                        </div>
                        <input 
                            type="number" 
                            name="total_income" 
                            required
                            min="0"
                            value={form.total_income} 
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-mono"
                        />
                    </div>
                </div>

                {/* Expense */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Pengeluaran (Expense)
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-medium text-sm group-focus-within:text-indigo-500">Rp</span>
                        </div>
                        <input 
                            type="number" 
                            name="total_expense" 
                            required
                            min="0"
                            value={form.total_expense} 
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* File Upload Area */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upload Bukti Dokumen
                </label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors group text-center py-8 px-6">
                    <input 
                        type="file" 
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-200">
                             <CloudUploadIcon />
                        </div>
                        <div className="text-sm text-slate-600">
                            {fileName ? (
                                <span className="text-indigo-600 font-medium">{fileName}</span>
                            ) : (
                                <>
                                    <span className="font-semibold text-indigo-600">Klik untuk upload</span> atau drag and drop
                                </>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">PDF, PNG, atau JPG (Maks. 5MB)</p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
                <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                    Batal
                </button>
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                        </>
                    ) : (
                        <>
                            <SaveIcon /> Publish Laporan
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