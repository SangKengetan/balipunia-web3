import { useEffect, useState } from "react";
import { fetchPublicPuras } from "../../api/public.api";
import PuraCard from "../../components/public/PuraCard";

export default function PuraList() {
  const [puras, setPuras] = useState([]);      // HARUS ARRAY
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuras = async () => {
      try {
        const res = await fetchPublicPuras();

        // 🔒 NORMALISASI DATA (ANTI .filter ERROR)
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

  // 🔒 DEFENSIVE FILTER
  const filteredPuras = Array.isArray(puras)
    ? puras.filter((pura) =>
        pura.nama_pura
          ?.toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Daftar Pura</h1>

      <input
        type="text"
        placeholder="Cari nama pura..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 rounded-lg border px-4 py-2 focus:outline-none focus:ring"
      />

      {loading ? (
        <p>Loading...</p>
      ) : filteredPuras.length === 0 ? (
        <p className="text-gray-500">Pura tidak ditemukan.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPuras.map((pura) => (
            <PuraCard key={pura.id} pura={pura} />
          ))}
        </div>
      )}
    </div>
  );
}
