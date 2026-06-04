import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { fetchFaqs } from "../../api/faq.api";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("SEMUA");
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await fetchFaqs();
        // Hanya ambil faq yang aktif
        setFaqs(res.data?.filter(f => f.is_active) || []);
      } catch (err) {
        console.error("Gagal mengambil data FAQ:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, []);

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = ["SEMUA", ...new Set(faqs.map(f => f.category))];
  
  const filteredFaqs = activeCategory === "SEMUA" 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="pt-32 pb-16 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6">
            Pusat Bantuan & <span className="text-(--punia-yellow)">FAQ</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Temukan jawaban atas pertanyaan umum terkait penggunaan BaliPunia, mulai dari cara mepunia hingga pengelolaan dana Pura.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            Belum ada data FAQ yang tersedia saat ini.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* Sidebar Categories */}
            <div className="w-full md:w-1/4">
              <div className="sticky top-32 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">Kategori</h3>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeCategory === cat 
                        ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20" 
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat === "SEMUA" ? "Semua Topik" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="w-full md:w-3/4 space-y-4">
              <AnimatePresence>
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                    >
                      <span className="font-bold text-slate-800 text-lg pr-4 leading-snug">
                        {faq.question}
                      </span>
                      <div className={`transform transition-transform duration-300 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${openItems[faq.id] ? "bg-yellow-100 text-yellow-600 rotate-180" : "bg-slate-100 text-slate-400"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {openItems[faq.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-gray-100 pt-4"
                        >
                          <div dangerouslySetInnerHTML={{ __html: faq.answer.replace(/\n/g, '<br/>') }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
