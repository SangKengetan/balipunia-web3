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
// Kita simpan address dalam variabel agar tidak salah copy-paste
const USDT_ADDRESS = "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd";
const USDC_ADDRESS = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";

const TOKEN_MAP = {
  [USDT_ADDRESS]: { symbol: "USDT", decimals: 18, icon: "💵" },
  [USDC_ADDRESS]: { symbol: "USDC", decimals: 18, icon: "🔵" },
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

  // Toggle State
  const [showOnchainDonate, setShowOnchainDonate] = useState(false);
  const [showOffchainDonate, setShowOffchainDonate] = useState(false);

  const handleToggleOffchain = () => {
    if (!isDonorAuthenticated) {
      Swal.fire({
        title: "Belum Login",
        text: "Anda harus login sebagai donatur terlebih dahulu sebelum berdonasi.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#d1d5db",
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
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#d1d5db",
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
    const fetchDetail = async () => {
      try {
        const res = await fetchPublicCampaignDetail(id);
        const data = res?.data || res;
        setCampaign(data.campaign);
        setOnchain(data.onchain || null); // Pastikan ini object, bukan undefined
        setOffchain(data.offchain || null);

        // Fetch campaign reports (social media style)
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar address={address} onConnect={connectWallet} />
      <div className="max-w-5xl mx-auto pt-24 px-4 sm:px-6 space-y-6">

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
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                {campaign.title}
              </h1>
              <div className="flex flex-wrap items-center text-gray-500 text-sm gap-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${campaign.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {campaign.status}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Batas Waktu: <span className="font-medium text-gray-800">{campaign.deadline ? new Date(campaign.deadline).toLocaleString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WITA' : 'Selamanya'}</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Campaign Image / PDF Viewer */}
          {campaign.image_url && (() => {
            const fullUrl = campaign.image_url.startsWith('http') ? campaign.image_url : `${import.meta.env.VITE_API_BASE_URL}${campaign.image_url}`;
            const isPdf = campaign.image_url.toLowerCase().endsWith('.pdf');

            return (
              <div className="mt-6 w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                {isPdf ? (
                  <iframe 
                    src={`${fullUrl}#view=FitH`}
                    className="w-full h-[500px] md:h-[700px]"
                    title="Dokumen Kegiatan"
                    frameBorder="0"
                  ></iframe>
                ) : (
                  <img 
                    src={fullUrl} 
                    alt={campaign.title} 
                    className="w-full h-[300px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
            );
          })()}
          
          {campaign.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Kegiatan</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>
            </div>
          )}
        </div>

        {/* DONATION ACTION SECTION */}
        {(() => {
          const isEnded = campaign.status !== 'ACTIVE' || (campaign.deadline && new Date(campaign.deadline) < new Date());

          if (isEnded) {
            return (
              <div className="bg-red-50 text-red-600 rounded-2xl shadow-sm border border-red-100 p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <h2 className="text-lg font-bold mb-1">Kegiatan Telah Berakhir</h2>
                <p className="text-sm opacity-80 font-medium">Pengumpulan dana untuk kegiatan ini telah ditutup. Terima kasih atas partisipasi Anda.</p>
              </div>
            );
          }

          return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Salurkan Donasi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tombol Offchain */}
                {campaign.campaign_type !== 'CRYPTO_ONLY' && (
                  <button
                    onClick={handleToggleOffchain}
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
                {campaign.campaign_type !== 'MIDTRANS_ONLY' && (
                  <button
                    onClick={handleToggleOnchain}
                    className={`flex items-center p-4 rounded-xl border-2 text-left transition-all ${showOnchainDonate ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                  >
                    <div className="mr-3 bg-indigo-100 p-2 rounded-full text-indigo-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <span className="block font-bold text-gray-800">Donasi Kripto</span>
                      <span className="text-xs text-gray-500">Transparan & dapat dilacak publik</span>
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
          );
        })()}

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COL: BLOCKCHAIN DATA & TIMELINE/REPORTS */}
          <div className={`space-y-6 ${campaign.campaign_type === 'CRYPTO_ONLY' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            {campaign.campaign_type !== 'MIDTRANS_ONLY' && onchain && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <h2 className="text-lg font-bold text-gray-900">Donasi Kripto (Transparan)</h2>
                </div>

                {/* === BAGIAN YANG DIPERBAIKI: BALANCES === */}
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

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <CryptoStatCard
                        label="USDT (Tether)"
                        balance={formatAmount(onchain.balances?.USDT, USDT_ADDRESS)}
                        totalCollected={formatAmount(totalUSDT.toString(), USDT_ADDRESS)}
                        icon="💵"
                        color="green"
                        hasDeadline={!!campaign.deadline}
                      />
                      <CryptoStatCard
                        label="USDC (USD Coin)"
                        balance={formatAmount(onchain.balances?.USDC, USDC_ADDRESS)}
                        totalCollected={formatAmount(totalUSDC.toString(), USDC_ADDRESS)}
                        icon="🔵"
                        color="blue"
                        hasDeadline={!!campaign.deadline}
                      />
                    </div>
                  );
                })()}
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
                          <td className="px-4 py-3 font-bold text-gray-800 text-xs sm:text-sm">{tx.donor}</td>
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

            {/* ====================================== */}
            {/* LAPORAN KEGIATAN - Social Media Feed */}
            {/* ====================================== */}
            {reports.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h2 className="text-lg font-bold text-gray-900">Laporan Penggunaan Dana</h2>
                </div>

                <div className="space-y-6">
                  {reports.map((r) => {
                    const gateway = "https://gateway.pinata.cloud";

                    return (
                      <div key={r.id} className="border border-gray-200 rounded-2xl overflow-hidden">

                        {/* Post Header */}
                        <div className="px-5 pt-5 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-300 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {(r.campaign_title || "?")[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-sm">{r.campaign_title}</h4>
                                <span className="text-xs text-gray-400">
                                  {new Date(r.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* IPFS Verify Badge */}
                            {r.metadata_cid && (
                              <a
                                href={r.metadata_url || `${gateway}/ipfs/${r.metadata_cid}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-mono hover:bg-emerald-100 transition-colors border border-emerald-200"
                                title="Verifikasi data asli di IPFS — hash ini tercatat permanen di Blockchain"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Cek Keaslian Data (Blockchain)
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Post Description */}
                        {r.description && (
                          <div className="px-5 pb-3">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {r.description}
                            </p>
                          </div>
                        )}

                        {/* Photo Grid */}
                        {r.media && r.media.length > 0 && (
                          <div className={`grid gap-0.5 ${r.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                            }`}>
                            {r.media.slice(0, 4).map((m, idx) => {
                              const isImage = m.mime_type?.startsWith("image/");
                              const spanFull = r.media.length === 3 && idx === 0;
                              // Force reliable gateway by prioritizing cid over whatever the backend sends as ipfs_url
                              const mediaUrl = m.cid ? `${gateway}/ipfs/${m.cid}` : m.ipfs_url;

                              return (
                                <a
                                  key={idx}
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block relative overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity ${spanFull ? 'col-span-2' : ''
                                    }`}
                                >
                                  {isImage ? (
                                    <img
                                      src={mediaUrl}
                                      alt={m.file_name}
                                      className="w-full h-48 object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      <span className="text-xs mt-1">{m.file_name}</span>
                                    </div>
                                  )}
                                  {idx === 3 && r.media.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="text-white text-2xl font-bold">+{r.media.length - 4}</span>
                                    </div>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Post Footer: Financial Summary */}
                        <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Total Dana Cair: {formatRupiah(r.total_income)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            Total Pengeluaran: {formatRupiah(r.total_expense)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Sisa Dana: {formatRupiah(r.total_income - r.total_expense)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* ====================================== */}
            {/* RIWAYAT PENCAIRAN DANA */}
            {/* ====================================== */}
            {offchain?.withdrawals && offchain.withdrawals.length > 0 && (
              <WithdrawalHistory withdrawals={offchain.withdrawals} />
            )}

          </div>

          {/* RIGHT COL: OFFCHAIN HISTORY */}
          {campaign.campaign_type !== 'CRYPTO_ONLY' && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <h2 className="text-lg font-bold text-gray-900">Donasi Tunai</h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto pr-1">
                  <OffchainDonationHistory campaignId={campaign.id} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* LEADERBOARD SECTION */}
        <div className="mt-8">
          <Leaderboard level="campaign" campaignId={id} />
        </div>
      </div>
    </div>
  );
}

/* ================== */
/* UI COMPONENTS      */
/* ================== */

function CryptoStatCard({ label, balance, totalCollected, icon, color, hasDeadline }) {
  const bgClass = color === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700';

  return (
    <div className={`rounded-xl border p-4 flex flex-col justify-between ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold opacity-80 tracking-wide uppercase">{label}</p>
        <div className="text-xl filter grayscale hover:grayscale-0 transition-all cursor-default">{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-70 font-medium">Total Terkumpul:</span>
          <span className="font-bold">{totalCollected}</span>
        </div>
        {!hasDeadline && (
          <div className="flex justify-between items-center text-sm border-t border-black/10 pt-2">
            <span className="opacity-70 font-medium">Dana Belum Ditarik:</span>
            <span className="font-bold">{balance}</span>
          </div>
        )}
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

function WithdrawalHistory({ withdrawals }) {
  if (!withdrawals || withdrawals.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900">Transparansi Pencairan Dana</h2>
      </div>

      <div className="space-y-4">
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
            <div key={wd.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${wd.status === 'COMPLETED' || wd.status === 'EXECUTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                    {wd.status === 'COMPLETED' || wd.status === 'EXECUTED' ? 'BERHASIL CAIR' : wd.status}
                  </span>
                  <div className="mt-2 text-sm text-gray-500 font-medium">
                    {new Date(wd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Bersih Diterima</p>
                  <p className="text-xl font-black text-gray-900">{formatRupiah(wd.total_idr)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mt-5 border-t border-gray-200 pt-5">
                <div>
                  <p className="text-gray-500 mb-2 font-semibold">Rincian Pengajuan Kotor:</p>
                  <ul className="space-y-2 text-gray-700">
                    {snapshot?.fiat?.amount_idr && Number(snapshot.fiat.amount_idr) > 0 && (
                      <li className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-medium text-gray-600">Dana Tunai (Fiat)</span>
                        <span className="font-bold">{formatRupiah(snapshot.fiat.amount_idr)}</span>
                      </li>
                    )}
                    {snapshot?.crypto?.amount_usdt && Number(snapshot.crypto.amount_usdt) > 0 && (
                      <li className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-medium text-gray-600">Kripto (USDT)</span>
                        <span className="font-bold">{formatAmount(snapshot.crypto.amount_usdt, USDT_ADDRESS)} USDT</span>
                      </li>
                    )}
                    {snapshot?.crypto?.amount_usdc && Number(snapshot.crypto.amount_usdc) > 0 && (
                      <li className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-medium text-gray-600">Kripto (USDC)</span>
                        <span className="font-bold">{formatAmount(snapshot.crypto.amount_usdc, USDC_ADDRESS)} USDC</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-gray-500 mb-2 font-semibold">Potongan Biaya (Fee):</p>
                  <ul className="space-y-2 text-gray-700 text-xs">
                    {fiatFee > 0 && (
                      <li className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100">
                        <span className="text-red-700 font-medium">Biaya Transfer Bank</span>
                        <span className="text-red-600 font-bold">-{formatRupiah(fiatFee)}</span>
                      </li>
                    )}
                    {cryptoFee > 0 && (
                      <li className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100">
                        <span className="text-red-700 font-medium">Biaya Admin Kripto </span>
                        <span className="text-red-600 font-bold">-{formatRupiah(cryptoFee)}</span>
                      </li>
                    )}
                    {(fiatFee === 0 && cryptoFee === 0) && (
                      <li className="text-gray-400 italic p-2">Tidak ada potongan fee dicatat.</li>
                    )}
                  </ul>
                </div>
              </div>

              {wd.reason && (
                <div className="mt-4 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                  <span className="font-semibold text-gray-700">Tujuan Pencairan:</span> {wd.reason}
                </div>
              )}

              {wd.transfer_proof_cid && (
                <div className="mt-4 flex justify-end">
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${wd.transfer_proof_cid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100 transition-colors border border-teal-200 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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