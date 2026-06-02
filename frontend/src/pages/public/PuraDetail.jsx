import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicPuraDetail, fetchFinancialReportsByPura } from "../../api/public.api"; // Pastikan import ini ada
import CampaignCardDB from "../../components/public/CampaignCardDB";
import Navbar from "../../components/Navbar";
import useWallet from "../../hooks/useWallet";

// --- Utility Helpers ---
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

export default function PuraDetail() {
  const { id } = useParams();
  const { address, connectWallet } = useWallet();
  
  // Data State
  const [pura, setPura] = useState(null);
  const [stats, setStats] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(15500); // Default USDT to IDR estimate
  const [campaignDB, setCampaignDB] = useState([]);
  const [campaignSC, setCampaignSC] = useState([]);
  
  // Financial Reports State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // General Loading
  const [loading, setLoading] = useState(true);
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState("campaigns");

  useEffect(() => {
    // Ambil rate USDT to IDR dari CoinGecko
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr')
      .then(res => res.json())
      .then(data => {
        if (data && data.tether && data.tether.idr) {
          setExchangeRate(data.tether.idr);
        }
      })
      .catch(err => console.error("Gagal mengambil rate USDT", err));

    const fetchAllData = async () => {
      try {
        // 1. Fetch Detail Pura & Campaign
        const resDetail = await fetchPublicPuraDetail(id);
        const data = resDetail?.data || resDetail;

        setPura(data.pura);
        setStats(data.stats || {
          total_available_offchain: 0,
          total_pending_transfer_offchain: 0,
          total_onchain: { usdt: "0", usdc: "0" }
        });
        setCampaignDB(Array.isArray(data.campaigns?.db) ? data.campaigns.db : []);
        setCampaignSC(Array.isArray(data.campaigns?.sc_only) ? data.campaigns.sc_only : []);

        // 2. Fetch Financial Reports (Parallel)
        try {
            const resReports = await fetchFinancialReportsByPura(id);
            setReports(resReports.data || []);
        } catch (reportErr) {
            console.error("Failed fetch reports (non-blocking):", reportErr);
            setReports([]); // Fallback empty
        } finally {
            setLoadingReports(false);
        }

      } catch (err) {
        console.error("Failed fetch pura detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const handleDonateOnchain = (campaignId) => {
    console.log("Donate onchain to campaign:", campaignId);
  };

  // Kalkulasi Dana Belum Dicairkan
  let undisbursedTotal = 0;
  if (stats) {
    const totalOnchainUsd = parseFloat(stats.total_onchain.usdt) + parseFloat(stats.total_onchain.usdc);
    const totalOnchainIdr = totalOnchainUsd * exchangeRate;
    undisbursedTotal = parseFloat(stats.total_available_offchain) + parseFloat(stats.total_pending_transfer_offchain) + totalOnchainIdr;
  } else if (pura) {
    // Fallback if stats isn't returned from old backend
    undisbursedTotal = Number(pura.saldo_pending_onchain || 0) + Number(pura.saldo_pending_offchain || 0);
  }

  if (loading) return <LoadingState />;
  if (!pura) return <EmptyState />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
      <Navbar address={address} onConnect={connectWallet} />
      {/* 1. HERO SECTION */}
      <div className="relative h-[320px] lg:h-[380px] bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={pura.profile_picture ? `https://gateway.pinata.cloud/ipfs/${pura.profile_picture}` : "https://images.unsplash.com/photo-1640716862072-94d7324bb2d7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
            alt="Bali Temple Background" 
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/90 backdrop-blur-sm border border-amber-300/30">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="text-white text-xs font-bold tracking-wide uppercase">Pura Terverifikasi</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {pura.nama_pura}
              </h1>
              
              <div className="flex items-center text-gray-200 text-sm md:text-base font-medium">
                 <svg className="w-5 h-5 mr-2 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 {pura.alamat_pura}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SaldoCard 
            title="Total Kas" 
            value={formatCurrency(pura.saldo_operasional)} 
            icon="wallet"
            color="amber"
          />
          <SaldoCard 
            title="Total Yang Belum Dicairkan" 
            value={formatCurrency(undisbursedTotal)} 
            icon="clock"
            color="indigo"
          />
        </div>

        {/* 3. TAB NAVIGATION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
            <div className="border-b border-gray-100">
                <nav className="flex gap-6 px-6" aria-label="Tabs">
                    <TabButton 
                        isActive={activeTab === 'campaigns'} 
                        onClick={() => setActiveTab('campaigns')}
                        label="Program Donasi"
                        icon={(
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        )}
                    />
                    <TabButton 
                        isActive={activeTab === 'reports'} 
                        onClick={() => setActiveTab('reports')}
                        label="Transparansi Dana"
                        icon={(
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                    />
                </nav>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="p-6 md:p-8 min-h-[400px]">
                
                {/* === VIEW 1: CAMPAIGNS === */}
                {activeTab === 'campaigns' && (() => {
                    const allCampaigns = [...campaignDB, ...campaignSC];
                    const campaignsWithDeadline = allCampaigns.filter(c => c.deadline != null);
                    const campaignsWithoutDeadline = allCampaigns.filter(c => c.deadline == null);

                    const renderCampaignCards = (campaigns) => {
                        if (campaigns.length === 0) return <EmptySection text="Belum ada program di kategori ini." />;
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {campaigns.map((c) => 
                                    <CampaignCardDB key={c.id || c.id_campaign_onchain} campaign={c} />
                                )}
                            </div>
                        );
                    };

                    return (
                        <div className="animate-fadeIn space-y-12">
                            {/* Berbatas Waktu */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-rose-50 rounded-lg">
                                        <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Program Berbatas Waktu</h2>
                                        <p className="text-sm text-gray-500">Program donasi dengan target waktu tertentu.</p>
                                    </div>
                                </div>
                                {renderCampaignCards(campaignsWithDeadline)}
                            </div>

                            {/* Terbuka */}
                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Program Rutin / Terbuka</h2>
                                        <p className="text-sm text-gray-500">Program yang selalu menerima donasi kapan saja.</p>
                                    </div>
                                </div>
                                {renderCampaignCards(campaignsWithoutDeadline)}
                            </div>
                        </div>
                    );
                })()}

                {/* === VIEW 2: FINANCIAL REPORTS (REAL) === */}
                {activeTab === 'reports' && (
                    <div className="animate-fadeIn space-y-6">
                        
                        {/* Info Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-amber-50 rounded-xl border border-amber-100 mb-8">
                            <div>
                                <h3 className="font-bold text-amber-900 text-lg">Laporan Keuangan Terverifikasi</h3>
                                <p className="text-sm text-amber-700 mt-1 max-w-2xl">
                                    Laporan ini dicatat menggunakan teknologi Blockchain untuk menjamin transparansi dan mencegah manipulasi data.
                                </p>
                            </div>
                        </div>

                        {/* Loading Logic */}
                        {loadingReports ? (
                             <div className="space-y-4">
                                {[1, 2].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-12 bg-gray-100 rounded"></div>
                                        <div className="h-12 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        ) : reports.length === 0 ? (
                            <EmptySection text="Belum ada laporan keuangan yang dipublikasikan oleh pengelola pura." />
                        ) : (
                            /* Real Reports List */
                            <div className="grid grid-cols-1 gap-6">
                                {reports.map((r) => (
                                    <div key={r.id} className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                        
                                        {/* Report Header */}
                                        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className="hidden sm:flex h-12 w-12 bg-white border border-gray-200 rounded-lg items-center justify-center text-amber-600 shadow-sm">
                                                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                                        {r.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Dipublikasikan: <span className="font-medium text-gray-700">{formatDate(r.created_at)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                Teraudit & Valid
                                            </span>
                                        </div>

                                        {/* Financial Stats */}
                                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <CurrencyStat label="Total Pemasukan" value={r.total_income} type="income" />
                                            <CurrencyStat label="Total Pengeluaran" value={r.total_expense} type="expense" />
                                        </div>

                                        {/* Footer: Proofs */}
                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3 items-center text-sm">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Bukti Audit:</span>
                                            
                                            {r.ipfs_cid && (
                                                <a href={`https://ipfs.io/ipfs/${r.ipfs_cid}`} target="_blank" rel="noreferrer" className="proof-badge group/link">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                    Penyimpanan Terdesentralisasi
                                                </a>
                                            )}

                                            {r.anchor_tx_hash && (
                                                <a href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`} target="_blank" rel="noreferrer" className="proof-badge group/link">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover/link:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                    Transaksi: {r.anchor_tx_hash.slice(0, 6)}...
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* CSS Utility for Proof Badges (Bisa dimasukkan ke index.css atau dibiarkan inline via Tailwind di bawah) */}
      <style>{`
        .proof-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            color: #4b5563;
            font-size: 0.75rem;
            font-family: monospace;
            transition: all 0.2s;
        }
        .proof-badge:hover {
            border-color: #d1d5db;
            color: #111827;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}

/* ===== HELPER COMPONENTS ===== */

// Currency Stat Component (Untuk Laporan)
function CurrencyStat({ label, value, type }) {
    const isIncome = type === "income";
    const colorClass = isIncome ? "text-emerald-600" : "text-rose-600";
    const bgClass = isIncome ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100";
    
    return (
      <div className={`flex flex-col p-3 rounded-lg border ${bgClass}`}>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</span>
        <div className={`flex items-center text-lg font-bold ${colorClass}`}>
          {isIncome ? "+" : "-"} {formatCurrency(value)}
        </div>
      </div>
    );
}

function TabButton({ isActive, onClick, label, icon }) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex items-center gap-2 py-5 px-1 text-sm font-medium transition-all duration-300
                ${isActive ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}
            `}
        >
            <span className={`transition-colors duration-300 ${isActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {icon}
            </span>
            {label}
            {/* Animated Underline */}
            <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-all duration-300 ${isActive ? 'bg-amber-500 scale-100' : 'bg-transparent scale-0'}`}></span>
        </button>
    )
}

function SaldoCard({ title, value, icon, color }) {
  const colors = {
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", iconBg: "bg-indigo-100" },
    gray: { bg: "bg-gray-50", text: "text-gray-600", iconBg: "bg-gray-100" },
  };
  
  const theme = colors[color] || colors.amber;

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 font-mono">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${theme.iconBg} ${theme.text}`}>
        {icon === "wallet" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        {icon === "chain" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
        {icon === "clock" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      </div>
    </div>
  );
}

function EmptySection({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
       <div className="p-4 bg-white rounded-full shadow-sm mb-3">
         <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
       </div>
       <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}

function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Pura Tidak Ditemukan</h1>
            <Link to="/" className="text-amber-600 font-semibold hover:underline">Kembali ke Beranda</Link>
        </div>
    )
}