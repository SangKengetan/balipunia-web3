import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPublicCampaignDetail } from "../../api/public.api";
import OnchainDonateBox from "../../components/OnchainDonateBox";
import OffchainDonateBox from "../../components/OffchainDonateBox";
import OffchainDonationHistory from "../../components/OffchainDonationHistory";
import CampaignTimeline from "../../components/public/CampaignTimeline";
import { ethers } from "ethers";

// --- KONFIGURASI TOKEN ---
// Kita simpan address dalam variabel agar tidak salah copy-paste
const USDT_ADDRESS = "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";
const USDC_ADDRESS = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";

const TOKEN_MAP = {
  [USDT_ADDRESS]: { symbol: "USDT", decimals: 6, icon: "💵" },
  [USDC_ADDRESS]: { symbol: "USDC", decimals: 6, icon: "🔵" },
};

function getTokenMeta(address = "") {
  return TOKEN_MAP[address.toLowerCase()] ?? { symbol: "UNKNOWN", decimals: 18, icon: "❓" };
}

// --- FIX: LOGIC FORMATTER SALDO ---
function formatAmount(rawAmount, tokenAddress) {
  // 1. Cek jika data kosong/null/undefined
  if (!rawAmount) return "0";
  console.log("Formatting amount:", rawAmount, "for token:", tokenAddress);

  try {
    const meta = getTokenMeta(tokenAddress);
    
    // 2. Format dari Wei/Smallest Unit ke Decimal (menggunakan ethers)
    // Pastikan rawAmount diubah ke string dulu agar aman
    const formatted = ethers.formatUnits(rawAmount.toString(), meta.decimals);

    // 3. Mempercantik angka (tambah koma ribuan)
    // Contoh: 10000 -> 10,000
    return Number(formatted).toLocaleString("en-US", { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    });
  } catch (error) {
    console.error("Error formatting amount:", error);
    return "0";
  }
}

function short(addr = "") {
  return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [onchain, setOnchain] = useState(null);
  const [offchain, setOffchain] = useState(null);
  const [loading, setLoading] = useState(true);

  // Toggle State
  const [showOnchainDonate, setShowOnchainDonate] = useState(false);
  const [showOffchainDonate, setShowOffchainDonate] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetchPublicCampaignDetail(id);
        const data = res?.data || res;
        setCampaign(data.campaign);
        setOnchain(data.onchain || null); // Pastikan ini object, bukan undefined
        setOffchain(data.offchain || null);
      } catch (err) {
        console.error("Failed fetch campaign detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!campaign) return <EmptyState />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER SECTION (Tombol Kembali & Judul) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <button 
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-amber-600 flex items-center gap-1 mb-4 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Kembali
            </button>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        {campaign.title}
                    </h1>
                    <div className="flex items-center text-gray-500 text-sm gap-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">
                            {campaign.status}
                        </span>
                        <span>
                            Deadline: <span className="font-medium text-gray-700">{new Date(campaign.deadline).toLocaleDateString()}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* DONATION ACTION SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Salurkan Donasi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Tombol Offchain */}
                 {campaign.campaign_type !== "SC-ONLY" && (
                    <button
                        onClick={() => { setShowOffchainDonate(!showOffchainDonate); setShowOnchainDonate(false); }}
                        className={`flex items-center p-4 rounded-xl border-2 text-left transition-all ${showOffchainDonate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                        <div className="mr-3 bg-blue-100 p-2 rounded-full text-blue-600">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800">Transfer Bank / Tunai</span>
                            <span className="text-xs text-gray-500">Donasi Rupiah konvensional</span>
                        </div>
                    </button>
                 )}

                 {/* Tombol Onchain */}
                 {campaign.is_onchain_enabled && (
                    <button
                        onClick={() => { setShowOnchainDonate(!showOnchainDonate); setShowOffchainDonate(false); }}
                        className={`flex items-center p-4 rounded-xl border-2 text-left transition-all ${showOnchainDonate ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                        <div className="mr-3 bg-indigo-100 p-2 rounded-full text-indigo-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800">Crypto (Web3)</span>
                            <span className="text-xs text-gray-500">Donasi Transparan via Blockchain</span>
                        </div>
                    </button>
                 )}
            </div>

            {/* Form Area */}
            <div className="mt-4">
                {showOffchainDonate && <OffchainDonateBox campaignId={campaign.id} />}
                {showOnchainDonate && (
                    <OnchainDonateBox 
                        onchainCampaignId={campaign.id_campaign_onchain} 
                        campaignType={campaign.campaign_type} 
                    />
                )}
            </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COL: BLOCKCHAIN DATA */}
            <div className="lg:col-span-2 space-y-6">
                {onchain && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                             <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             <h2 className="text-lg font-bold text-gray-900">Transparansi Dana (On-Chain)</h2>
                        </div>

                        {/* === BAGIAN YANG DIPERBAIKI: BALANCES === */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <CryptoStatCard 
                                label="Saldo USDT" 
                                // Gunakan helper formatAmount dengan Address Token USDT yang benar
                                value={formatAmount(onchain.balances?.USDT, USDT_ADDRESS)}
                                icon="💵" 
                                color="green"
                            />
                            <CryptoStatCard 
                                label="Saldo USDC" 
                                // Gunakan helper formatAmount dengan Address Token USDC yang benar
                                value={formatAmount(onchain.balances?.USDC, USDC_ADDRESS)}
                                icon="🔵" 
                                color="blue"
                            />
                        </div>
                        {/* =========================================== */}

                        {/* Transaction Table */}
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Transaksi Masuk</h3>
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                             <TransactionTable
                                headers={["Donatur", "Token", "Jumlah", "Waktu"]}
                                rows={onchain.transactions || []}
                                renderRow={(tx, i) => {
                                    const tokenMeta = getTokenMeta(tx.token);
                                    return (
                                        <tr key={i} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-indigo-600 text-xs sm:text-sm">{short(tx.donor)}</td>
                                            <td className="px-4 py-3 text-sm">{tokenMeta.symbol}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800 text-sm">
                                                {formatAmount(tx.amount, tx.token)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {new Date(tx.timestamp * 1000).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Linimasa Program</h2>
                    <CampaignTimeline campaignId={campaign.id} />
                </div>
            </div>

            {/* RIGHT COL: OFFCHAIN HISTORY */}
            <div className="lg:col-span-1">
                 {campaign.is_offchain_enabled && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <h2 className="text-lg font-bold text-gray-900">Donasi Tunai</h2>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto pr-1">
                            <OffchainDonationHistory campaignId={campaign.id} />
                        </div>
                    </div>
                 )}
            </div>

        </div>
      </div>
    </div>
  );
}

/* ================== */
/* UI COMPONENTS      */
/* ================== */

function CryptoStatCard({ label, value, icon, color }) {
  const bgClass = color === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700';

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between ${bgClass}`}>
      <div>
        <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-xl font-bold font-mono">{value}</p>
      </div>
      <div className="text-2xl filter grayscale hover:grayscale-0 transition-all cursor-default">
          {icon}
      </div>
    </div>
  );
}

function TransactionTable({ headers, rows, renderRow }) {
  if (!rows || rows.length === 0)
    return <p className="text-sm text-gray-400 py-4 text-center italic">Belum ada transaksi tercatat.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">
            <p>Campaign tidak ditemukan.</p>
        </div>
    )
}