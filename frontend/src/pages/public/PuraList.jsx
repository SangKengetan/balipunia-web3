import { useEffect, useState } from "react";
import { fetchPublicPuras } from "../../api/public.api";
import PuraCard from "../../components/public/PuraCard";

// Pastikan path image sesuai struktur folder project Anda.
// Jika menggunakan Vite, terkadang lebih aman mengimportnya:
// import heroBg from "../../assets/BG-Hero.png";

// Komponen Skeleton (Tetap sama, karena sudah bagus)
const PuraSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200 w-full"></div>
    <div className="p-5 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
    </div>
  </div>
);

export default function PuraList() {
  const [puras, setPuras] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuras = async () => {
      try {
        const res = await fetchPublicPuras();
        const data = Array.isArray(res) ? res : res?.data;
        setPuras(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed fetch public puras:", error);
        setPuras([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPuras();
  }, []);

  const filteredPuras = Array.isArray(puras)
    ? puras.filter((pura) =>
        pura.nama_pura?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* === SECTION 1: HERO HEADER (Centered & Background) === */}
      <div 
        className="relative w-full h-[450px] flex items-center justify-center bg-cover bg-center"
        // Menggunakan inline style untuk background image agar dinamis
        style={{ backgroundImage: "url('/src/assets/BG-Hero.png')" }}
      >
        {/* Dark Overlay: Supaya teks putih terbaca di atas foto apapun */}
        <div className="absolute inset-0 bg-gray-900/60"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-4xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
            Daftar Pura Terdaftar
          </h1>
          <p className="text-gray-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto drop-shadow-md">
            Temukan pura, salurkan punia dengan transparansi, dan jaga warisan budaya tanpa mengubah makna.
          </p>

          {/* Big Centered Search Bar */}
          <div className="relative max-w-2xl mx-auto transform transition-all hover:scale-[1.01]">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg 
                className="h-6 w-6 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari nama pura atau yayasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-14 pr-6 py-5 rounded-full text-gray-900 placeholder-gray-500 bg-white shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-500/30 text-base md:text-lg border-0"
            />
          </div>
        </div>
      </div>

      {/* === SECTION 2: LIST CONTENT === */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* Statistics / Info Bar (Optional: Menambah kesan profesional) */}
        {!loading && (
            <div className="mb-8 flex items-center justify-between">
                <p className="text-gray-600 font-medium">
                    Menampilkan <span className="font-bold text-gray-900">{filteredPuras.length}</span> Pura
                </p>
            </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <PuraSkeleton key={i} />)}
          </div>
        ) : filteredPuras.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-dashed border-gray-300">
            <div className="bg-gray-50 mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
               <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Pura tidak ditemukan</h3>
            <p className="text-gray-500 mt-2">
              Kami tidak dapat menemukan pura dengan kata kunci "{search}".
            </p>
            <button 
                onClick={() => setSearch("")}
                className="mt-4 text-yellow-600 font-medium hover:text-yellow-700 hover:underline"
            >
                Tampilkan semua pura
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPuras.map((pura) => (
              <PuraCard key={pura.id} pura={pura} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}