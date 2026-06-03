import { useEffect, useState } from "react";
import { fetchFaqs, createFaq, updateFaq, deleteFaq } from "../../api/faq.api";
import useToast from "../../hooks/useToast";

export default function FAQManagement() {
  const { success, error, confirm } = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState("DASAR");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetchFaqs();
      setFaqs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCategory("DASAR");
    setQuestion("");
    setAnswer("");
    setIsActive(true);
  };

  const handleSave = async () => {
    if (!question || !answer) {
      error("Pertanyaan dan Jawaban wajib diisi");
      return;
    }
    try {
      if (editingId) {
        await updateFaq(editingId, { category, question, answer, is_active: isActive });
        success("FAQ berhasil diperbarui");
      } else {
        await createFaq({ category, question, answer, is_active: isActive });
        success("FAQ berhasil ditambahkan");
      }
      resetForm();
      loadFaqs();
    } catch (err) {
      error(err.message || "Gagal menyimpan FAQ");
    }
  };

  const handleEdit = (faq) => {
    setEditingId(faq.id);
    setCategory(faq.category);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsActive(faq.is_active);
  };

  const handleDelete = (id) => {
    confirm("Hapus FAQ ini secara permanen?", async () => {
      try {
        await deleteFaq(id);
        success("FAQ berhasil dihapus");
        loadFaqs();
      } catch (err) {
        error(err.message || "Gagal menghapus FAQ");
      }
    });
  };

  return (
    <div className="space-y-8 fade-in-enter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            FAQ Management
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola pertanyaan dan jawaban (FAQ) yang tampil di halaman utama publik.
          </p>
        </div>
        <div className="hidden md:block">
           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
             Total FAQ: {faqs.length}
           </span>
        </div>
      </div>

      {/* Action Card: Create/Edit FAQ */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

        <h2 className="text-lg font-bold text-slate-800 mb-4">
          {editingId ? "Edit FAQ" : "Tambah FAQ Baru"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-3 space-y-1">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Kategori</label>
             <select
               value={category}
               onChange={(e) => setCategory(e.target.value)}
               className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-yellow-400 focus:bg-white transition-all"
             >
               <option value="DASAR">Dasar & Umum</option>
               <option value="DONATUR">Panduan Donatur</option>
               <option value="FEE">Biaya & Fee</option>
               <option value="PENGURUS">Panduan Pengurus</option>
               <option value="KEAMANAN">Keamanan & Bantuan</option>
             </select>
          </div>

          <div className="md:col-span-9 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Pertanyaan</label>
              <input
                type="text"
                placeholder="Contoh: Apa itu dompet kripto?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-yellow-400 focus:bg-white transition-all"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Jawaban</label>
              <textarea
                placeholder="Tulis jawaban lengkap di sini..."
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-yellow-400 focus:bg-white transition-all resize-y"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-400"
                />
                <span className="text-sm font-medium text-slate-700">Tampilkan ke Publik (Aktif)</span>
              </label>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 text-slate-600 px-4 py-2 text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-6 py-2 text-sm font-bold shadow-lg shadow-yellow-400/30 transition-all"
                >
                  {editingId ? "Update FAQ" : "Simpan FAQ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
             <p>Belum ada data FAQ.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-1/6">Kategori</th>
                  <th className="px-6 py-4 w-1/3">Pertanyaan</th>
                  <th className="px-6 py-4 w-1/3">Jawaban</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {faq.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {faq.question}
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">
                      {faq.answer}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        faq.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {faq.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="text-blue-500 hover:underline font-medium text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="text-red-500 hover:underline font-medium text-xs ml-2"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
