import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  TrendingUp 
} from "lucide-react";

// Helper untuk format Rupiah
const formatIDR = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk format Crypto (Asumsi 6 desimal untuk USDT/USDC)
// Di real app, gunakan library seperti ethers.js: ethers.utils.formatUnits(value, 6)
const formatCrypto = (valueStr) => {
  const val = parseFloat(valueStr) / 1000000; // Asumsi 6 decimals
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function Dashboard() {
  // Simulasi State data dari Backend API
  const [stats, setStats] = useState({
    total_campaigns: 0,
    total_offchain: 0,
    total_onchain: { usdt: "0", usdc: "0" },
    loading: true,
  });

  // Simulasi Fetch Data (Ganti dengan API call aslimu nanti)
  useEffect(() => {
    // Anggap ini request ke endpoint: GET /api/admin/pura/dashboard
    setTimeout(() => {
      setStats({
        total_campaigns: 12,
        total_offchain: 45000000, // Rp 45.000.000
        total_onchain: {
          usdt: "1500000000", // 1500 USDT (6 decimals)
          usdc: "2450000000", // 2450 USDC (6 decimals)
        },
        loading: false,
      });
    }, 1000);
  }, []);

  if (stats.loading) {
    return <div className="p-8 text-gray-500">Memuat data dashboard...</div>;
  }

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen font-sans">
      {/* 1. Header Section */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Om Swastyastu, Admin Pura
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Berikut adalah ringkasan aktivitas dana punia dan kampanye Anda.
        </p>
      </header>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Total Campaign */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Megaphone size={24} />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
              Total Aktif
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Kampanye</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {stats.total_campaigns}
            </h3>
          </div>
        </div>

        {/* Card 2: Off-chain Funds (Fiat) - THEME COLOR */}
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          {/* Decorative Background Blob */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Wallet size={24} />
            </div>
            <div className="text-green-600 flex items-center text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp size={14} className="mr-1" /> Fiat
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium">Dana Terkumpul (IDR)</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {formatIDR(stats.total_offchain)}
            </h3>
          </div>
        </div>

        {/* Card 3: On-chain Funds (Web3) */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
          {/* Subtle Grid Pattern for Tech Feel */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-gray-700/50 rounded-xl border border-gray-600">
              <Coins size={24} className="text-amber-400" />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-gray-700 text-gray-300 rounded-full border border-gray-600">
              Web 3.0
            </span>
          </div>
          
          <div className="relative z-10">
            <p className="text-sm text-gray-400 font-medium mb-1">Aset Crypto (Vault)</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">USDT</span>
                <span className="font-bold font-mono text-lg text-amber-400">
                   ${formatCrypto(stats.total_onchain.usdt)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-1 mt-1">
                <span className="text-gray-300 text-sm">USDC</span>
                <span className="font-bold font-mono text-lg text-blue-400">
                   ${formatCrypto(stats.total_onchain.usdc)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions / Next Section Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Aksi Cepat</h3>
        </div>
        <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm shadow-amber-200">
                <Megaphone size={18} /> Buat Kampanye
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
                <ArrowUpRight size={18} /> Ajukan Withdraw
            </button>
        </div>
      </div>
    </div>
  );
}