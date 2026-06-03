import { useState, useEffect } from "react";
import axios from "axios";

export default function Leaderboard({ level = "global", campaignId = null, puraId = null }) {
  const [tab, setTab] = useState("rupiah"); // 'rupiah' | 'kripto'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ offchain: [], onchain: [] });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        let url = `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/global`;
        if (level === "campaign" && campaignId) {
          url = `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/campaign/${campaignId}`;
        } else if (level === "pura" && puraId) {
          url = `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/pura/${puraId}`;
        }

        const res = await axios.get(url);
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Gagal mengambil leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [level, campaignId, puraId]);

  const currentList = tab === "rupiah" ? data.offchain : data.onchain;

  const formatAmount = (amount, isRupiah) => {
    if (isRupiah) {
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount).replace(/,00$/, "");
    }
    // For Crypto (usually comes in as eth string or numeric)
    return `${parseFloat(amount).toFixed(2)} Token`;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900 border-yellow-500 shadow-yellow-200";
    if (rank === 2) return "bg-slate-300 text-slate-800 border-slate-400 shadow-slate-200";
    if (rank === 3) return "bg-amber-600 text-amber-50 border-amber-700 shadow-amber-200";
    return "bg-gray-100 text-gray-500 border-gray-200";
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          Top Mepunia
        </h3>
        
        <div className="flex p-1 bg-gray-50 rounded-xl">
          <button 
            onClick={() => setTab("rupiah")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === "rupiah" ? "bg-white text-yellow-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Rupiah
          </button>
          <button 
            onClick={() => setTab("kripto")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === "kripto" ? "bg-white text-yellow-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Kripto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/></svg>
            <p className="font-medium">Belum ada data donasi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((item) => (
              <div key={item.rank} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 shadow-sm ${getMedalColor(item.rank)}`}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate" title={item.name}>{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg">
                    {formatAmount(item.total_amount, tab === "rupiah")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
