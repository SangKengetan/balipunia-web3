import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPublicCampaignDetail, fetchPublicCampaignReports } from "../../api/public.api";
import OnchainDonateBox from "../../components/OnchainDonateBox";
import OffchainDonateBox from "../../components/OffchainDonateBox";
import OffchainDonationHistory from "../../components/OffchainDonationHistory";
import CampaignTimeline from "../../components/public/CampaignTimeline";
import Leaderboard from "../../components/Leaderboard";
import { ethers } from "ethers";
import useDonorAuth from "../../hooks/useDonorAuth";
import Navbar from "../../components/Navbar";
import useWallet from "../../hooks/useWallet";
import Swal from "sweetalert2";

// --- KONFIGURASI TOKEN ---
const USDT_ADDRESS = "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";
const USDC_ADDRESS = "0x64544969ed7ebf5f083679233325356ebe738930";

const TOKEN_MAP = {
  [USDT_ADDRESS]: { symbol: "USDT", decimals: 18, icon: "USDT", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  [USDC_ADDRESS]: { symbol: "USDC", decimals: 18, icon: "USDC", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "USDT": { symbol: "USDT", decimals: 18, icon: "USDT", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "USDC": { symbol: "USDC", decimals: 18, icon: "USDC", color: "text-blue-700 bg-blue-50 border-blue-200" },
};

function getTokenMeta(address = "") {
  return TOKEN_MAP[address.toLowerCase()] ?? TOKEN_MAP[address.toUpperCase()] ?? { symbol: "UNKNOWN", decimals: 18, icon: "TOKEN", color: "text-slate-500 bg-slate-50 border-slate-200" };
}

function formatAmount(rawAmount, tokenAddress) {
  if (!rawAmount) return "0";
  try {
    const meta = getTokenMeta(tokenAddress);
    const formatted = ethers.formatUnits(rawAmount.toString(), meta.decimals);
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

function formatRupiah(amount) {
  const val = amount || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val);
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDonorAuthenticated } = useDonorAuth();
  const { address, connectWallet } = useWallet();

  const [campaign, setCampaign] = useState(null);
  const [onchain, setOnchain] = useState(null);
  const [offchain, setOffchain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  // Token Price State
  const [tokenPrices, setTokenPrices] = useState({ USDT: 0, USDC: 0 });

  // Toggle State
  const [showOnchainDonate, setShowOnchainDonate] = useState(false);
  const [showOffchainDonate, setShowOffchainDonate] = useState(false);

  // PDF Viewer State
  const [selectedPdf, setSelectedPdf] = useState(null);

  const handleToggleOffchain = () => {
    if (!isDonorAuthenticated) {
      Swal.fire({
        title: "Belum Login",
        text: "Anda harus login sebagai donatur terlebih dahulu sebelum berdonasi.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FBBF24",
        cancelButtonColor: "#9ca3af",
        confirmButtonText: "Ke Halaman Login",
        cancelButtonText: "Nanti Saja"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/donor/login");
        }
      });
      return;
    }
    setShowOffchainDonate(!showOffchainDonate);
    setShowOnchainDonate(false);
  };

  const handleToggleOnchain = () => {
    if (!isDonorAuthenticated) {
      Swal.fire({
        title: "Belum Login",
        text: "Anda harus login sebagai donatur terlebih dahulu sebelum berdonasi.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FBBF24",
        cancelButtonColor: "#9ca3af",
        confirmButtonText: "Ke Halaman Login",
        cancelButtonText: "Nanti Saja"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/donor/login");
        }
      });
      return;
    }
    setShowOnchainDonate(!showOnchainDonate);
    setShowOffchainDonate(false);
  };

  useEffect(() => {
    // Fetch crypto prices
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=idr")
      .then(res => res.json())
      .then(data => {
        setTokenPrices({
          USDT: data.tether?.idr || 0,
          USDC: data["usd-coin"]?.idr || 0
        });
      })
      .catch(err => console.error("Failed to fetch prices:", err));

    const fetchDetail = async () => {
      try {
        const res = await fetchPublicCampaignDetail(id);
        const data = res?.data || res;
        setCampaign(data.campaign);
        setOnchain(data.onchain || null);
        setOffchain(data.offchain || null);

        try {
          const reportsRes = await fetchPublicCampaignReports(id);
          setReports(reportsRes?.data || []);
        } catch (e) {
          console.log("No campaign reports:", e.message);
        }
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

  const isEnded = campaign.status !== 'ACTIVE' || (campaign.deadline && new Date(campaign.deadline) < new Date());

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 font-sans text-slate-800">
      <Navbar address={address} onConnect={connectWallet} />
      
      {/* HEADER HERO AREA */}
      <div className="w-full bg-white border-b border-gray-200 pt-28 pb-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-500 hover:text-[#FBBF24] flex items-center gap-2 mb-6 transition-colors w-fit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            Kembali
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                {campaign.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <span className={`px-4 py-1.5 rounded-full border ${campaign.status === 'ACTIVE' ? 'bg-[#FBBF24]/10 text-yellow-700 border-[#FBBF24]/30' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {campaign.status}
                </span>
                <span className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Batas Waktu: <span className="text-slate-800">{campaign.deadline ? new Date(campaign.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WITA' : 'Selamanya'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COL: MAIN CONTENT */}
          <div className="lg:w-2/3 space-y-10">
            
            {/* Media Viewer */}
            {campaign.image_url && (() => {
              const fullUrl = campaign.image_url.startsWith('http') ? campaign.image_url : `${import.meta.env.VITE_API_BASE_URL}${campaign.image_url}`;
              const isPdf = campaign.image_url.toLowerCase().endsWith('.pdf');

              return (
                <div className="w-full rounded-3xl overflow-hidden shadow-md border border-gray-100 bg-black group relative">
                  {isPdf ? (
                    <iframe 
                      src={`${fullUrl}#view=FitH`}
                      className="w-full h-[500px] md:h-[700px] bg-white"
                      title="Dokumen Kegiatan"
                      frameBorder="0"
                    ></iframe>
                  ) : (
                    <img 
                      src={fullUrl} 
                      alt={campaign.title} 
                      className="w-full h-[400px] md:h-[500px] object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-in-out"
                    />
                  )}
                </div>
              );
            })()}

            {/* Description */}
            {campaign.description && (
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  Tentang Kegiatan
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {campaign.description}
                </p>
              </div>
            )}

            {/* Onchain Data */}
            {campaign.campaign_type !== 'MIDTRANS_ONLY' && onchain && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[#FBBF24]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transparansi Kripto</h2>
                    <p className="text-sm text-slate-500">Tercatat permanen di Blockchain</p>
                    {tokenPrices.USDT > 0 && (
                      <p className="text-xs font-bold text-slate-400 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">
                        Harga Live: 1 USDT = {formatRupiah(tokenPrices.USDT)} | 1 USDC = {formatRupiah(tokenPrices.USDC)}
                      </p>
                    )}
                  </div>
                </div>

                {(() => {
                  let totalUSDT = 0n;
                  let totalUSDC = 0n;
                  if (onchain?.transactions) {
                    onchain.transactions.forEach((tx) => {
                      try {
                        const amt = BigInt(tx.amount || 0);
                        if (tx.token.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
                          totalUSDT += amt;
                        } else if (tx.token.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
                          totalUSDC += amt;
                        }
                      } catch (e) { }
                    });
                  }

                  // Konversi total token ke IDR
                  const totalUSDTNum = Number(ethers.formatUnits(totalUSDT.toString(), 18));
                  const totalUSDCNum = Number(ethers.formatUnits(totalUSDC.toString(), 18));
                  const totalUSDT_IDR = totalUSDTNum * (tokenPrices.USDT || 0);
                  const totalUSDC_IDR = totalUSDCNum * (tokenPrices.USDC || 0);

                  const balUSDTNum = Number(ethers.formatUnits((onchain.balances?.USDT || "0").toString(), 18));
                  const balUSDCNum = Number(ethers.formatUnits((onchain.balances?.USDC || "0").toString(), 18));
                  const balUSDT_IDR = balUSDTNum * (tokenPrices.USDT || 0);
                  const balUSDC_IDR = balUSDCNum * (tokenPrices.USDC || 0);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                      <CryptoStatCard
                        label="USDT (Tether)"
                        tokenAmount={`${totalUSDTNum.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT`}
                        totalCollected={formatRupiah(totalUSDT_IDR)}
                        balanceIDR={formatRupiah(balUSDT_IDR)}
                        balanceToken={`${balUSDTNum.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT`}
                        meta={getTokenMeta("USDT")}
                        hasDeadline={!!campaign.deadline}
                        priceLoaded={tokenPrices.USDT > 0}
                      />
                      <CryptoStatCard
                        label="USDC (USD Coin)"
                        tokenAmount={`${totalUSDCNum.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`}
                        totalCollected={formatRupiah(totalUSDC_IDR)}
                        balanceIDR={formatRupiah(balUSDC_IDR)}
                        balanceToken={`${balUSDCNum.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`}
                        meta={getTokenMeta("USDC")}
                        hasDeadline={!!campaign.deadline}
                        priceLoaded={tokenPrices.USDC > 0}
                      />
                    </div>
                  );
                })()}

                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Riwayat Transaksi Kripto</h3>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-slate-50/50">
                  <TransactionTable
                    headers={["Donatur", "Token", "Jumlah (IDR)", "Waktu"]}
                    rows={onchain.transactions || []}
                    renderRow={(tx, i) => {
                      const tokenMeta = getTokenMeta(tx.token);
                      const displayDonor = tx.donor.startsWith("0x") ? short(tx.donor) : tx.donor;
                      const tokenNum = Number(ethers.formatUnits((tx.amount || "0").toString(), tokenMeta.decimals));
                      const priceKey = tokenMeta.symbol;
                      const amtIDR = tokenNum * (tokenPrices[priceKey] || 0);
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-white transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-800 text-sm">{displayDonor}</td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-600">
                            <div>
                              <span className={`px-2 py-1 rounded border text-[10px] font-black ${tokenMeta.color}`}>
                                {tokenMeta.symbol}
                              </span>
                              <span className="block text-[11px] text-slate-400 mt-1">{tokenNum.toLocaleString('en-US', { maximumFractionDigits: 4 })} {tokenMeta.symbol}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                            {tokenPrices[priceKey] > 0 ? formatRupiah(amtIDR) : <span className="text-slate-400 italic text-xs">Memuat harga...</span>}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {new Date(tx.timestamp * 1000).toLocaleString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                Linimasa Program
              </h2>
              <CampaignTimeline campaignId={campaign.id} />
            </div>

            {/* OFFCHAIN HISTORY (Tunai) */}
            {campaign.campaign_type !== 'CRYPTO_ONLY' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Donasi Masuk (Tunai)</h2>
                    <p className="text-sm text-slate-500">Daftar donatur yang telah berpartisipasi</p>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <OffchainDonationHistory campaignId={campaign.id} />
                </div>
              </div>
            )}

            {/* Withdrawals */}
            {offchain?.withdrawals && offchain.withdrawals.length > 0 && (
              <WithdrawalHistory withdrawals={offchain.withdrawals} />
            )}
          </div>

          {/* RIGHT COL: STICKY SIDEBAR */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 space-y-8">
              
              {/* DONATION BOX */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-[#FBBF24]/5 border border-[#FBBF24]/20 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FBBF24] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                
                {isEnded ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Kegiatan Berakhir</h2>
                    <p className="text-slate-500 text-sm">Pengumpulan dana untuk kegiatan ini telah ditutup. Terima kasih atas partisipasi Anda.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Salurkan Punia</h2>
                    
                    <div className="flex flex-col gap-4">
                      {/* Tombol Offchain */}
                      {campaign.campaign_type !== 'CRYPTO_ONLY' && (
                        <button
                          onClick={handleToggleOffchain}
                          className={`flex items-center p-4 rounded-2xl border-2 text-left transition-all group ${showOffchainDonate ? 'border-[#FBBF24] bg-[#FBBF24]/10 shadow-sm' : 'border-slate-100 hover:border-[#FBBF24]/50 bg-white'}`}
                        >
                          <div className={`mr-4 p-3 rounded-full transition-colors ${showOffchainDonate ? 'bg-[#FBBF24] text-slate-900' : 'bg-slate-50 text-slate-400 group-hover:bg-[#FBBF24]/20 group-hover:text-yellow-700'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 text-lg">Tunai / Transfer</span>
                            <span className="text-sm text-slate-500 font-medium">Donasi Rupiah konvensional</span>
                          </div>
                        </button>
                      )}

                      {/* Tombol Onchain */}
                      {campaign.campaign_type !== 'MIDTRANS_ONLY' && (
                        <button
                          onClick={handleToggleOnchain}
                          className={`flex items-center p-4 rounded-2xl border-2 text-left transition-all group ${showOnchainDonate ? 'border-slate-900 bg-slate-900 shadow-md' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                        >
                          <div className={`mr-4 p-3 rounded-full transition-colors ${showOnchainDonate ? 'bg-[#FBBF24] text-slate-900' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-800'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                          <div>
                            <span className={`block font-bold text-lg ${showOnchainDonate ? 'text-white' : 'text-slate-900'}`}>Kripto (Web3)</span>
                            <span className={`text-sm font-medium ${showOnchainDonate ? 'text-slate-300' : 'text-slate-500'}`}>Transparan & tercatat di Blockchain</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Form Area */}
                    <div className="mt-6">
                      {showOffchainDonate && (
                        <div className="animate-fade-in-up">
                          <OffchainDonateBox campaignId={campaign.id} />
                        </div>
                      )}
                      {showOnchainDonate && (
                        <div className="animate-fade-in-up">
                          <OnchainDonateBox
                            onchainCampaignId={campaign.id_campaign_onchain}
                            campaignType={campaign.campaign_type}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* LEADERBOARD SIDEBAR BLOCK */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <Leaderboard level="campaign" campaignId={id} />
              </div>

            </div>
          </div>

        </div>

        {/* REPORTS SECTION (BOTTOM) */}
        <div className="mt-20">
          {reports.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-yellow-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Laporan Penggunaan Dana</h2>
                  <p className="text-sm text-slate-500">Rincian resmi penggunaan dana dari penyelenggara</p>
                </div>
              </div>

              <div className="space-y-16">
                {reports.map((r, rIdx) => {
                  const gateway = "https://gateway.pinata.cloud";
                  const imageMedia = r.media?.filter(m => m.mime_type?.startsWith("image/")) || [];
                  const docMedia = r.media?.filter(m => !m.mime_type?.startsWith("image/")) || [];
                  return (
                    <div key={r.id} className={`${rIdx > 0 ? 'pt-16 border-t border-gray-100' : ''}`}>
                      {/* Header Laporan */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-[#FBBF24] font-bold text-xl flex-shrink-0">
                            {rIdx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{r.campaign_title}</h3>
                            <span className="text-sm text-slate-500">
                              Diterbitkan: {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        {r.metadata_cid && (
                          <a
                            href={r.metadata_url || `${gateway}/ipfs/${r.metadata_cid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-[#FBBF24]/10 text-yellow-800 rounded-full font-semibold hover:bg-[#FBBF24]/20 transition-colors border border-[#FBBF24]/30 flex-shrink-0"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Terverifikasi di IPFS
                          </a>
                        )}
                      </div>

                      {/* Layout 2 kolom: kiri info, kanan preview */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* KOLOM KIRI: Ringkasan Keuangan + Deskripsi */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Ringkasan Dana Berdasarkan Fund Mechanism */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ringkasan Keuangan</p>
                            <div className="space-y-3">
                              {campaign?.fund_mechanism === 'pasca' ? (
                                <>
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-slate-600">Income Sistem</span>
                                    <span className="font-bold text-emerald-600">{formatRupiah(r.income_system)}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-slate-600">Income Outside</span>
                                    <span className="font-bold text-emerald-600">{formatRupiah(r.income_outside)}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-slate-600">Income Peturunan</span>
                                    <span className="font-bold text-emerald-600">{formatRupiah(r.income_peturunan)}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-slate-600">Dana Sistem</span>
                                    <span className="font-bold text-emerald-600">{formatRupiah(r.income_system)}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                    <span className="text-sm font-semibold text-slate-600">Dana Diluar Sistem</span>
                                    <span className="font-bold text-emerald-600">{formatRupiah(r.income_outside)}</span>
                                  </div>
                                </>
                              )}
                              
                              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                                <span className="text-sm font-semibold text-slate-600">Total Pengeluaran</span>
                                <span className="font-bold text-rose-600">{formatRupiah(r.total_expense)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rincian Sumber Dana (jika ada) */}
                          {r.income_details && r.income_details.length > 0 && (
                            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">Sumber Dana</p>
                              <div className="space-y-2">
                                {r.income_details.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-100">
                                    <span className="text-sm font-semibold text-slate-600">{item.label || item.name}</span>
                                    <span className="font-bold text-emerald-700">{formatRupiah(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deskripsi */}
                          {r.description && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Keterangan</p>
                              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{r.description}</p>
                            </div>
                          )}

                          {/* File Dokumen (PDF dll) */}
                          {docMedia.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Berkas Pendukung</p>
                              <div className="space-y-2">
                                {docMedia.map((m, idx) => {
                                  const mediaUrl = m.cid ? `${gateway}/ipfs/${m.cid}` : m.ipfs_url;
                                  return (
                                    <button 
                                      key={idx} 
                                      onClick={() => setSelectedPdf(mediaUrl)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-slate-50 hover:border-slate-200 transition-colors group text-left"
                                    >
                                      <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                                        <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                      </div>
                                      <span className="text-sm font-medium text-slate-700 truncate">{m.file_name || `Berkas ${idx + 1}`}</span>
                                      <svg className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* KOLOM KANAN: Preview Gambar Inline */}
                        <div className="lg:col-span-3">
                          {imageMedia.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Dokumentasi Foto</p>
                              {imageMedia.length === 1 ? (
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                  <img
                                    src={imageMedia[0].cid ? `${gateway}/ipfs/${imageMedia[0].cid}` : imageMedia[0].ipfs_url}
                                    alt={imageMedia[0].file_name}
                                    className="w-full max-h-[500px] object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  {imageMedia.map((m, idx) => {
                                    const mediaUrl = m.cid ? `${gateway}/ipfs/${m.cid}` : m.ipfs_url;
                                    const isFirst = idx === 0 && imageMedia.length % 2 !== 0;
                                    return (
                                      <div key={idx} className={`rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative ${isFirst ? 'col-span-2' : ''}`}>
                                        <img
                                          src={mediaUrl}
                                          alt={m.file_name}
                                          className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${isFirst ? 'max-h-72' : 'h-52'}`}
                                          loading="lazy"
                                        />
                                        {m.file_name && (
                                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium truncate block">{m.file_name}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12">
                              <div className="text-center">
                                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-sm text-slate-400 font-medium">Tidak ada dokumentasi foto</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Laporan Penggunaan Dana</h2>
              <p className="text-slate-500 max-w-md mx-auto">Penyelenggara belum mempublikasikan rincian penggunaan dana untuk kegiatan ini. Silakan periksa kembali secara berkala.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PDF VIEWER */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-10 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Pratinjau Dokumen
              </h3>
              <button 
                onClick={() => setSelectedPdf(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-grow bg-slate-100">
              <iframe 
                src={`${selectedPdf}#view=FitH`} 
                className="w-full h-full"
                title="PDF Viewer"
                frameBorder="0"
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================== */
/* UI COMPONENTS      */
/* ================== */

function CryptoStatCard({ label, tokenAmount, totalCollected, balanceIDR, balanceToken, meta, hasDeadline, priceLoaded }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`text-sm font-black px-2 py-1 rounded border ${meta.color}`}>{meta.icon}</div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-1">Total Terkumpul</p>
          {priceLoaded ? (
            <p className="font-extrabold text-2xl text-slate-900">{totalCollected}</p>
          ) : (
            <p className="font-bold text-lg text-slate-400 italic">Memuat harga...</p>
          )}
          <p className="text-xs text-slate-400 mt-1">{tokenAmount}</p>
        </div>
        {!hasDeadline && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">Dana Belum Ditarik</p>
            <p className="font-bold text-[#FBBF24] text-lg">{priceLoaded ? balanceIDR : '—'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{balanceToken}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionTable({ headers, rows, renderRow }) {
  if (!rows || rows.length === 0)
    return <div className="py-8 text-center"><p className="text-sm font-medium text-slate-400">Belum ada transaksi tercatat.</p></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#FBBF24] rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse">Memuat data...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-lg font-bold text-slate-700">Campaign tidak ditemukan.</p>
        <button onClick={() => window.history.back()} className="mt-4 text-[#FBBF24] font-bold hover:underline">Kembali</button>
      </div>
    </div>
  );
}

function WithdrawalHistory({ withdrawals }) {
  if (!withdrawals || withdrawals.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transparansi Pencairan Dana</h2>
          <p className="text-sm text-slate-500">Bukti riwayat penarikan dana oleh penyelenggara</p>
        </div>
      </div>

      <div className="space-y-6">
        {withdrawals.map((wd) => {
          let snapshot = {};
          try {
            snapshot = typeof wd.amount_snapshot === "string" ? JSON.parse(wd.amount_snapshot) : wd.amount_snapshot;
          } catch (e) {
            console.error("Failed to parse amount_snapshot", e);
          }

          const cryptoFee = snapshot?.crypto?.fee_idr || 0;
          const fiatFee = snapshot?.fiat?.fee_idr || 0;

          return (
            <div key={wd.id} className="border border-gray-100 rounded-3xl p-6 md:p-8 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${wd.status === 'COMPLETED' || wd.status === 'EXECUTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {wd.status === 'COMPLETED' || wd.status === 'EXECUTED' ? 'BERHASIL CAIR' : wd.status}
                  </span>
                  <div className="mt-3 text-sm text-slate-500 font-semibold">
                    {new Date(wd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-right bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Total Bersih Diterima</p>
                  <p className="text-2xl font-black text-emerald-600">{formatRupiah(wd.total_idr)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-6 border-t border-gray-200 pt-6">
                <div>
                  <p className="text-slate-500 mb-3 font-bold text-xs uppercase tracking-wider">Rincian Pengajuan Kotor</p>
                  <ul className="space-y-2 text-slate-700">
                    {snapshot?.fiat?.amount_idr && Number(snapshot.fiat.amount_idr) > 0 && (
                      <li className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-semibold text-slate-500">Dana Tunai (Fiat)</span>
                        <span className="font-extrabold">{formatRupiah(snapshot.fiat.amount_idr)}</span>
                      </li>
                    )}
                    {snapshot?.crypto?.amount_usdt && Number(snapshot.crypto.amount_usdt) > 0 && (
                      <li className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-semibold text-slate-500">Kripto (USDT)</span>
                        <span className="font-extrabold">{formatAmount(snapshot.crypto.amount_usdt, USDT_ADDRESS)} USDT</span>
                      </li>
                    )}
                    {snapshot?.crypto?.amount_usdc && Number(snapshot.crypto.amount_usdc) > 0 && (
                      <li className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="font-semibold text-slate-500">Kripto (USDC)</span>
                        <span className="font-extrabold">{formatAmount(snapshot.crypto.amount_usdc, USDC_ADDRESS)} USDC</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-slate-500 mb-3 font-bold text-xs uppercase tracking-wider">Potongan Biaya (Fee)</p>
                  <ul className="space-y-2 text-slate-700">
                    {fiatFee > 0 && (
                      <li className="flex justify-between items-center bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">
                        <span className="text-rose-700 font-semibold">Biaya Transfer Bank</span>
                        <span className="text-rose-600 font-extrabold">-{formatRupiah(fiatFee)}</span>
                      </li>
                    )}
                    {cryptoFee > 0 && (
                      <li className="flex justify-between items-center bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">
                        <span className="text-rose-700 font-semibold">Biaya Admin Kripto</span>
                        <span className="text-rose-600 font-extrabold">-{formatRupiah(cryptoFee)}</span>
                      </li>
                    )}
                    {(fiatFee === 0 && cryptoFee === 0) && (
                      <li className="text-slate-400 font-medium italic px-4 py-3 bg-white rounded-xl border border-gray-100">
                        Tidak ada potongan fee dicatat.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {wd.reason && (
                <div className="mt-6 text-sm text-slate-700 bg-white p-5 rounded-2xl border border-gray-100">
                  <span className="font-bold text-slate-900 block mb-1">Tujuan Pencairan:</span> 
                  <span className="leading-relaxed block">{wd.reason}</span>
                </div>
              )}

              {wd.transfer_proof_cid && (
                <div className="mt-6 flex justify-end">
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${wd.transfer_proof_cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md text-sm"
                  >
                    <svg className="w-4 h-4 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Lihat Bukti Transfer
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}