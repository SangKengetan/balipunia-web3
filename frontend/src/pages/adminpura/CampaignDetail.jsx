import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCampaignDetailFull } from "../../api/adminPura.api"; // Pastikan path benar
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  User, 
  Coins, 
  History, 
  FileText,
  Copy
} from "lucide-react";

// --- Helper Functions ---

// Format angka desimal crypto
const formatCrypto = (val) => {
  if (!val) return "0.00";
  // Asumsi val adalah string raw integer dari smart contract (6 decimals)
  return (parseFloat(val) / 1000000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Memendekkan Address Wallet (misal: 0x123...abc)
const shortenAddress = (address) => {
  if (!address) return "-";
  if (address.length < 10) return address; // Jika nama orang (bukan wallet)
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format Tanggal
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function CampaignDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading agar transisi halus
    getCampaignDetailFull(id)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // --- Skeleton Loader (Agar tidak jarring saat refresh) ---
  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { campaign, onchain_balance, donation_history } = data;

  return (
    <div className="font-sans space-y-8 pb-10">
      {/* 1. Navigation & Header */}
      <div>
        <Link 
            to="/admin/pura/campaigns" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 mb-4 transition-colors"
        >
            <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Campaign
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {campaign.title}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
                <Calendar size={14}/> Dibuat: {formatDate(campaign.created_at || new Date())}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="uppercase tracking-wider font-semibold text-amber-600">
                {campaign.category || "Umum"}
            </span>
        </div>
      </div>

      {/* 2. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === LEFT COLUMN: Content & History === */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b border-gray-100 pb-2">
                    <FileText size={20} className="text-amber-500" />
                    <h2>Deskripsi Kampanye</h2>
                </div>
                <div className="prose prose-amber max-w-none text-gray-600 leading-relaxed">
                    {/* Menggunakan whitespace-pre-wrap agar enter/paragraf terbaca */}
                    <p className="whitespace-pre-wrap">{campaign.description}</p>
                </div>
            </div>

            {/* Donation History Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                        <History size={20} className="text-amber-500" />
                        <h2>Riwayat Donasi</h2>
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                        {donation_history.length} Transaksi
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    {donation_history.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Donatur</th>
                                    <th className="px-6 py-3">Jumlah</th>
                                    <th className="px-6 py-3">Token</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {donation_history.map((d, i) => (
                                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-700 font-medium font-mono">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 flex items-center justify-center text-amber-700 text-xs">
                                                    <User size={14}/>
                                                </div>
                                                {shortenAddress(d.donor)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-800">
                                            {formatCrypto(d.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
                                                d.token === 'USDT' 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                <Coins size={10} /> {d.token}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs text-gray-400 italic">Success</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <History size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>Belum ada donasi tercatat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* === RIGHT COLUMN: Sticky Sidebar === */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            
            {/* 1. On-Chain Vault Card */}
            {onchain_balance ? (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                    {/* Header Dark */}
                    <div className="bg-gray-900 p-5 text-white">
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <Wallet size={18} className="text-amber-400"/>
                            <span className="text-xs font-semibold uppercase tracking-wider">Vault Balance</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-200">Dana Tersimpan</h3>
                    </div>
                    
                    {/* Body Content */}
                    <div className="bg-white p-5 space-y-4">
                        {/* USDT */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">
                                    T
                                </div>
                                <span className="font-semibold text-gray-600">USDT</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-gray-900">
                                {formatCrypto(onchain_balance.USDT)}
                            </span>
                        </div>

                        {/* USDC */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                    C
                                </div>
                                <span className="font-semibold text-gray-600">USDC</span>
                            </div>
                            <span className="font-mono text-lg font-bold text-gray-900">
                                {formatCrypto(onchain_balance.USDC)}
                            </span>
                        </div>

                        <div className="pt-2">
                             <p className="text-xs text-center text-gray-400">
                                Dana ini tersimpan aman di Smart Contract
                             </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-200">
                    Kampanye ini belum terhubung ke On-chain Vault.
                </div>
            )}

            {/* 2. Metadata / Info Tambahan */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase text-opacity-50">Informasi Tambahan</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Batas Waktu</span>
                        <span className="font-medium text-gray-800 text-right">
                             {campaign.deadline ? formatDate(campaign.deadline) : "Selamanya"}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Creator</span>
                        <span className="font-medium text-gray-800">Admin Pura</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}