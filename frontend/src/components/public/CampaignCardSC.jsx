import React from "react";
import { useNavigate } from "react-router-dom";

// Helper format angka
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Helper format tanggal
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function CampaignCardSC({ campaign }) {
  const navigate = useNavigate();

  // Destructure Data
  const { 
    id, // UUID dari database
    id_campaign_onchain, // ID numeric di Blockchain
    title, 
    status, 
    deadline, 
    balances 
  } = campaign;

  const isActive = status === "ACTIVE";

  return (
    // Wrapper Card (Sama persis dengan Card DB)
    <div
      onClick={() => navigate(`/campaign/${id}`)}
      className="group relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* --- 1. Bagian Gambar (Header) --- */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {/* Placeholder Image (Nuansa Teknologi/Blockchain + Bali) */}
        <img
          src="https://plus.unsplash.com/premium_photo-1677829177642-30def98b0963?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>

        {/* Badge Status */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border ${
            isActive 
              ? "bg-green-500/20 text-white border-green-400" 
              : "bg-gray-500/20 text-gray-200 border-gray-400"
          }`}>
            {status}
          </span>
        </div>

        {/* Badge Tipe Campaign */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500 text-white shadow-lg flex items-center gap-1 border border-indigo-400">
             {/* Icon Blockchain Kecil */}
             <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
             Smart Contract
          </span>
        </div>
      </div>

      {/* --- 2. Bagian Konten (Body) --- */}
      <div className="p-5 flex flex-col flex-1">
        {/* Judul */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>

        {/* INFO KHUSUS SC: Tampilkan Balance Box */}
        {/* Menggantikan badges payment method di card DB */}
        <div className="bg-indigo-50/50 rounded-lg border border-indigo-100 p-3 mb-4">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                On-Chain Balance
              </span>
              <span className="text-[10px] text-gray-400">ID: #{id_campaign_onchain}</span>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
              {/* USDT */}
              <div className="flex flex-col">
                 <span className="text-xs text-gray-500">USDT</span>
                 <span className="text-sm font-bold text-gray-800">{formatNumber(balances?.USDT)}</span>
              </div>
              {/* Divider Vertical */}
              <div className="border-l border-indigo-200 pl-3 flex flex-col">
                 <span className="text-xs text-gray-500">USDC</span>
                 <span className="text-sm font-bold text-gray-800">{formatNumber(balances?.USDC)}</span>
              </div>
           </div>
        </div>

        {/* Divider Tipis */}
        <div className="border-t border-gray-100 my-auto"></div>

        {/* --- 3. Footer (Deadline & Action) --- */}
        <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
                {/* Icon Calendar SVG */}
                <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <span className="text-xs font-medium leading-tight">
                    {deadline ? "Kegiatan Berakhir:" : "Batas Waktu:"} <br/> 
                    <span className="text-gray-700">{deadline ? formatDate(deadline) : "Selalu Terbuka"}</span>
                </span>
            </div>

            {/* Tombol Panah Kecil */}
            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-500 flex items-center justify-center transition-colors duration-300">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
        </div>
      </div>
    </div>
  );
}