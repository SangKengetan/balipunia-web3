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
  Banknote,
  Share2,
  Download
} from "lucide-react";
import Swal from "sweetalert2";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

// --- Helper Functions ---

// Format angka desimal crypto
const formatCrypto = (val) => {
  if (!val) return "0.00";
  return (parseFloat(val) / 1e18).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatRupiah = (val) => {
  if (!val) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(val);
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

  const campaign = data?.campaign || {};
  const onchain_balance = data?.funds?.onchain || null;
  const offchain_balance = data?.funds?.offchain || 0;
  
  const onchain_donations = data?.donations?.onchain || [];
  const offchain_donations = data?.donations?.offchain || [];

  const type = campaign.campaign_type; // 'HYBRID', 'MIDTRANS_ONLY', 'CRYPTO_ONLY'
  const isFiat = type === 'HYBRID' || type === 'MIDTRANS_ONLY';
  const isCrypto = type === 'HYBRID' || type === 'CRYPTO_ONLY';

  return (
    <div className="font-sans space-y-8 pb-10">
      {/* 1. Navigation & Header */}
      <div>
        <Link 
            to="/admin/pura/campaigns" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 mb-4 transition-colors"
        >
            <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Kegiatan
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
                {campaign.purpose || "Umum"}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
                {type}
            </span>
        </div>
      </div>

      {/* 2. Quick Actions */}
      {campaign.status === "WITHDRAWN" && (!data?.reports || data.reports.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-amber-800">Laporan Kegiatan Diperlukan</h3>
            <p className="text-sm text-amber-700 mt-1">
              Dana telah ditarik. Harap segera unggah laporan dokumentasi dan mutasi keuangan terkait penggunaan dana ini.
            </p>
          </div>
          <Link 
            to={`/admin/pura/campaigns/${id}/report`}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <FileText size={18} />
            Buat Laporan
          </Link>
        </div>
      )}

      {/* 3. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* === LEFT COLUMN: Content & History === */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b border-gray-100 pb-2">
                    <FileText size={20} className="text-amber-500" />
                    <h2>Deskripsi Kegiatan</h2>
                </div>
                <div className="prose prose-amber max-w-none text-gray-600 leading-relaxed">
                    {/* Menggunakan whitespace-pre-wrap agar enter/paragraf terbaca */}
                    <p className="whitespace-pre-wrap">{campaign.description}</p>
                </div>
            </div>

            {/* Fiat Donation History Table */}
            {isFiat && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/50">
                      <div className="flex items-center gap-2 font-bold text-gray-800">
                          <History size={20} className="text-amber-500" />
                          <h2>Riwayat Punia Rupiah</h2>
                      </div>
                      <span className="bg-white text-gray-600 text-xs px-2 py-1 rounded-full font-medium border border-gray-200">
                          {offchain_donations.length} Transaksi
                      </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                      {offchain_donations.length > 0 ? (
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                  <tr>
                                      <th className="px-6 py-3">Donatur</th>
                                      <th className="px-6 py-3">Jumlah</th>
                                      <th className="px-6 py-3">Waktu</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {offchain_donations.map((d, i) => (
                                      <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 flex items-center justify-center text-amber-700 text-xs uppercase">
                                                      {(d.donor || '?')[0]}
                                                  </div>
                                                  {d.donor}
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 font-bold text-gray-800">
                                              {formatRupiah(d.amount)}
                                          </td>
                                          <td className="px-6 py-4 text-gray-500 text-xs">
                                              {formatDate(d.timestamp)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      ) : (
                          <div className="p-8 text-center text-gray-400">
                              <History size={32} className="mx-auto mb-2 opacity-50"/>
                              <p>Belum ada punia rupiah tercatat.</p>
                          </div>
                      )}
                  </div>
              </div>
            )}

            {/* Crypto Donation History Table */}
            {isCrypto && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50/30">
                      <div className="flex items-center gap-2 font-bold text-gray-800">
                          <History size={20} className="text-amber-500" />
                          <h2>Riwayat Punia Kripto</h2>
                      </div>
                      <span className="bg-white text-gray-600 text-xs px-2 py-1 rounded-full font-medium border border-gray-200">
                          {onchain_donations.length} Transaksi
                      </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                      {onchain_donations.length > 0 ? (
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                  <tr>
                                      <th className="px-6 py-3">Donatur</th>
                                      <th className="px-6 py-3">Jumlah</th>
                                      <th className="px-6 py-3">Mata Uang</th>
                                      <th className="px-6 py-3">Waktu</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {onchain_donations.map((d, i) => (
                                      <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="flex items-center gap-2 text-gray-700 font-medium font-mono">
                                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 flex items-center justify-center text-amber-700 text-xs uppercase">
                                                      {(d.donor || '?')[0]}
                                                  </div>
                                                  {d.donor}
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
                                          <td className="px-6 py-4 text-gray-500 text-xs">
                                              {formatDate(d.timestamp * 1000)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      ) : (
                          <div className="p-8 text-center text-gray-400">
                              <History size={32} className="mx-auto mb-2 opacity-50"/>
                              <p>Belum ada punia kripto tercatat.</p>
                          </div>
                      )}
                  </div>
              </div>
            )}
        </div>

        {/* === RIGHT COLUMN: Sticky Sidebar === */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            
            {/* 1. Off-Chain (Fiat) Balance Card */}
            {isFiat && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                  <div className="bg-amber-500 p-5 text-white">
                      <div className="flex items-center gap-2 mb-1 opacity-90">
                          <Banknote size={18} className="text-amber-100"/>
                          <span className="text-xs font-semibold uppercase tracking-wider">Dana Rupiah</span>
                      </div>
                  </div>
                  
                  <div className="bg-white p-5 space-y-4">
                      {(() => {
                        const totalCollectedOffchain = offchain_donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
                        return (
                          <>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="font-medium text-gray-600 text-sm">Total Terkumpul</span>
                                <span className="font-bold text-gray-900">
                                    {formatRupiah(totalCollectedOffchain)}
                                </span>
                            </div>
                            
                            {!campaign.deadline && (
                              <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                  <span className="font-medium text-gray-600 text-sm">Belum Ditarik</span>
                                  <span className="font-bold text-gray-900">
                                      {formatRupiah(offchain_balance)}
                                  </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      
                      <div className="pt-2">
                            <p className="text-xs text-center text-gray-400">
                              Dana ini dikelola melalui platform pembayaran
                            </p>
                      </div>
                  </div>
              </div>
            )}

            {/* 2. On-Chain (Crypto) Vault Card */}
            {isCrypto && onchain_balance ? (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                    <div className="bg-gray-900 p-5 text-white">
                        <div className="flex items-center gap-2 mb-1 opacity-80">
                            <Wallet size={18} className="text-amber-400"/>
                            <span className="text-xs font-semibold uppercase tracking-wider">Dana Kripto</span>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 space-y-4">
                        {(() => {
                          let totalCollectedUSDT = 0n;
                          let totalCollectedUSDC = 0n;
                          onchain_donations.forEach((d) => {
                            try {
                              const amt = BigInt(d.amount || 0);
                              if (d.token === 'USDT') totalCollectedUSDT += amt;
                              if (d.token === 'USDC') totalCollectedUSDC += amt;
                            } catch(e) {}
                          });

                          return (
                            <>
                              {/* USDT */}
                              <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                  <div className="flex items-center gap-3 mb-1">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">T</div>
                                      <span className="font-bold text-gray-800 text-sm">USDT</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Terkumpul:</span>
                                    <span className="font-mono font-bold text-gray-900">{formatCrypto(totalCollectedUSDT.toString())}</span>
                                  </div>
                                  {!campaign.deadline && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Belum Ditarik:</span>
                                      <span className="font-mono font-bold text-gray-900">{formatCrypto(onchain_balance.USDT)}</span>
                                    </div>
                                  )}
                              </div>

                              {/* USDC */}
                              <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                  <div className="flex items-center gap-3 mb-1">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">C</div>
                                      <span className="font-bold text-gray-800 text-sm">USDC</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Terkumpul:</span>
                                    <span className="font-mono font-bold text-gray-900">{formatCrypto(totalCollectedUSDC.toString())}</span>
                                  </div>
                                  {!campaign.deadline && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Belum Ditarik:</span>
                                      <span className="font-mono font-bold text-gray-900">{formatCrypto(onchain_balance.USDC)}</span>
                                    </div>
                                  )}
                              </div>
                            </>
                          );
                        })()}

                        <div className="pt-2">
                             <p className="text-xs text-center text-gray-400">
                                Dana ini tersimpan aman di Smart Contract
                             </p>
                        </div>
                    </div>
                </div>
            ) : isCrypto && !onchain_balance ? (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-200">
                    Kegiatan ini belum terhubung ke On-chain Vault.
                </div>
            ) : null}

            {/* 3. Metadata / Info Tambahan */}
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
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-gray-800">{campaign.status}</span>
                    </div>
                </div>
            </div>

            {/* 4. Share & QR Code */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase text-opacity-50">Bagikan Kegiatan</h3>
                <p className="text-xs text-gray-500 mb-4">Ajak lebih banyak donatur berpartisipasi dengan membagikan tautan ini.</p>
                
                <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <QRCodeCanvas 
                        id="qr-gen"
                        value={`${window.location.origin}/campaign/${id}`}
                        size={150}
                        bgColor={"#ffffff"}
                        fgColor={"#1f2937"}
                        level={"Q"}
                        includeMargin={false}
                    />
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/campaign/${id}`);
                            Swal.fire({ icon: 'success', title: 'Tersalin!', text: 'Tautan berhasil disalin.', timer: 2000, showConfirmButton: false, width: '300px' });
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-sm transition-colors"
                    >
                        <Share2 size={16} /> Salin
                    </button>
                    <button 
                        onClick={() => {
                            const canvas = document.getElementById("qr-gen");
                            if (canvas) {
                                const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                                let downloadLink = document.createElement("a");
                                downloadLink.href = pngUrl;
                                downloadLink.download = `QR_Kegiatan_${id}.png`;
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-sm transition-colors"
                    >
                        <Download size={16} /> Unduh
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}