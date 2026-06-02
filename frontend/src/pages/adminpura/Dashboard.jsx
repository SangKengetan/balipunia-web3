import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../../api/adminPura.api";
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

// Helper untuk format Crypto (Sudah di-format desimal dari backend)
const formatCrypto = (valueStr) => {
  if (!valueStr) return "0.00";
  const val = parseFloat(valueStr);
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    saldo_operasional: 0,
    total_campaigns: 0,
    total_offchain: 0,
    total_available_offchain: 0,
    total_pending_transfer_offchain: 0,
    total_onchain: { usdt: "0", usdc: "0" },
    loading: true,
  });
  const [exchangeRate, setExchangeRate] = useState(15500); // Default estimate

  useEffect(() => {
    // Fetch dashboard stats
    getDashboardSummary()
      .then((res) => {
        const data = res.data?.data || res.data || {};
        setStats({
          saldo_operasional: parseFloat(data.saldo_operasional) || 0,
          total_campaigns: data.total_campaigns || 0,
          total_offchain: parseFloat(data.total_offchain) || 0,
          total_available_offchain: parseFloat(data.total_available_offchain) || 0,
          total_pending_transfer_offchain: parseFloat(data.total_pending_transfer_offchain) || 0,
          total_onchain: {
            usdt: data.total_onchain?.usdt || "0",
            usdc: data.total_onchain?.usdc || "0",
          },
          loading: false,
        });
      })
      .catch((err) => {
        console.error(err);
        setStats((prev) => ({ ...prev, loading: false }));
      });

    // Fetch USDT to IDR rate
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr')
      .then(res => res.json())
      .then(data => {
        if (data && data.tether && data.tether.idr) {
          setExchangeRate(data.tether.idr);
        }
      })
      .catch(err => console.error("Gagal mengambil rate USDT", err));
  }, []);

  // Hitung total onchain dalam IDR
  const totalOnchainUsd = parseFloat(stats.total_onchain.usdt) + parseFloat(stats.total_onchain.usdc);
  const totalOnchainIdr = totalOnchainUsd * exchangeRate;

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
          Berikut adalah ringkasan aktivitas dana punia dan kegiatan Anda.
        </p>
      </header>

      {/* 2. Stats Grid - 5 Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Saldo Operasional (Kas Pura) */}
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Wallet size={24} />
            </div>
            <div className="text-blue-600 flex items-center text-xs font-bold bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
              Kas Pura
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium">Saldo Operasional</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {formatIDR(stats.saldo_operasional)}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Kegiatan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
              <Megaphone size={24} />
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
              Total Aktif
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Kegiatan</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">
              {stats.total_campaigns}
            </h3>
          </div>
        </div>

        {/* Card 3: Saldo Tersisa Midtrans */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Wallet size={24} />
            </div>
            <div className="text-emerald-600 flex items-center text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              Belum Dicairkan
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium">Saldo Tersisa Midtrans</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {formatIDR(stats.total_available_offchain)}
            </h3>
          </div>
        </div>

        {/* Card 4: Saldo Tersisa Kripto */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Coins size={24} />
            </div>
            <div className="text-purple-600 flex items-center text-xs font-bold bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
              Belum Dicairkan
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium">Saldo Tersisa Kripto (IDR)</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {formatIDR(totalOnchainIdr)}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Est: 1 USDT = {formatIDR(exchangeRate)}</p>
          </div>
        </div>

        {/* Card 5: Saldo Belum Ditransfer */}
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            <div className="text-amber-600 flex items-center text-xs font-bold bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              Pending
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm text-gray-500 font-medium">Saldo Belum Ditransfer</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate">
              {formatIDR(stats.total_pending_transfer_offchain)}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions / Next Section Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Aksi Cepat</h3>
        </div>
        <div className="flex gap-4">
            <Link to="/admin/pura/campaigns/create" className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm shadow-amber-200">
                <Megaphone size={18} /> Buat Kegiatan
            </Link>
            <Link to="/admin/pura/campaigns" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
                <ArrowUpRight size={18} /> Ajukan Pencairan Dana
            </Link>
        </div>
      </div>
    </div>
  );
}