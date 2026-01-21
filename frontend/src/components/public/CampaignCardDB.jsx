import React from "react";
import { useNavigate } from "react-router-dom";

// Helper sederhana untuk tanggal (bisa dipindah ke utils jika mau)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function CampaignCardDB({ campaign }) {
  const navigate = useNavigate();

  // Membongkar data dari props (Destructuring)
  const { 
    id, 
    title, 
    campaign_type, 
    deadline, 
    status, 
    is_onchain_enabled, 
    is_offchain_enabled 
  } = campaign;

  const isActive = status === "ACTIVE";

  return (
    // Wrapper Card
    <div
      onClick={() => navigate(`/campaign/${id}`)}
      className="group relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* --- Bagian Gambar (Header) --- */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {/* Gambar Placeholder */}
        <img
          src="https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&q=80&w=1000"
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay Gelap Dikit */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

        {/* Badge Status (Kiri Atas) */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border ${
            isActive 
              ? "bg-green-500/20 text-white border-green-400" 
              : "bg-gray-500/20 text-gray-200 border-gray-400"
          }`}>
            {status}
          </span>
        </div>

        {/* Badge Tipe Campaign (Kanan Atas) */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-400 text-amber-950 shadow-lg flex items-center gap-1">
             {campaign_type === "HYBRID" ? "Hybrid" : "Smart Contract"}
          </span>
        </div>
      </div>

      {/* --- Bagian Konten (Body) --- */}
      <div className="p-5 flex flex-col flex-1">
        {/* Judul Campaign */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
          {title}
        </h3>

        {/* Info Metode Pembayaran (Badge Onchain/Offchain) */}
        <div className="flex flex-wrap gap-2 mb-4">
          {is_onchain_enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
              {/* Icon Wallet SVG */}
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              Crypto (Web3)
            </span>
          )}
          {is_offchain_enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
              {/* Icon Card SVG */}
              <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Fiat (QRIS)
            </span>
          )}
        </div>

        {/* Divider Tipis */}
        <div className="border-t border-gray-100 my-auto"></div>

        {/* --- Footer (Deadline & Action) --- */}
        <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
                {/* Icon Calendar SVG */}
                <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <span className="text-xs font-medium leading-tight">
                    Deadline: <br/> 
                    <span className="text-gray-700">{formatDate(deadline)}</span>
                </span>
            </div>

            {/* Tombol Panah Kecil */}
            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-amber-400 flex items-center justify-center transition-colors duration-300">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
        </div>
      </div>
    </div>
  );
}