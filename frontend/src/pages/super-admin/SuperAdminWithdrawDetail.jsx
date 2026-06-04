import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchWithdrawTransfers,
  completeWithdrawTransfer,
} from "../../api/superAdmin.api";
import { showError, showSuccess } from "../../utils/notification";
import {
  Wallet,
  Upload,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  X,
  ArrowRightLeft,
  ExternalLink,
  ArrowLeft,
  Building2,
  CreditCard,
  UserCircle
} from "lucide-react";

export default function SuperAdminWithdrawDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithdrawTransfers();
      const list = res.data.data || [];
      // ID from params is string, ID from API might be number
      const detail = list.find((item) => item.id.toString() === id);
      
      if (!detail) {
        setError("Data pencairan tidak ditemukan.");
      } else {
        setData(detail);
      }
    } catch (e) {
      setError(e.message || "Gagal memuat detail pencairan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const parseSnapshot = (snapshot) => {
    try {
      if (typeof snapshot === "string") return JSON.parse(snapshot);
      return snapshot;
    } catch {
      return null;
    }
  };

  const formatRupiah = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "Rp 0";
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  const formatCrypto = (val) => {
    if (!val || val === "0") return "0.00";
    return (parseFloat(val) / 1e18).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const handleSubmitTransfer = async () => {
    if (!file) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("transfer_proof", file);
      await completeWithdrawTransfer(id, formData);
      showSuccess("Berhasil", "Bukti transfer berhasil diunggah.");
      loadData(); // Reload to see COMPLETED state
    } catch (e) {
      showError("Gagal Mengunggah", e.response?.data?.message || "Gagal mengunggah bukti transfer", "Pastikan file valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    const config = {
      REQUESTED: { style: "bg-gray-100 text-gray-700", label: "Menunggu Voting", icon: <Clock size={16} /> },
      VOTING_IN_PROGRESS: { style: "bg-blue-100 text-blue-700", label: "Voting Berjalan", icon: <Loader2 className="animate-spin" size={16} /> },
      PENDING_TRANSFER: { style: "bg-amber-100 text-amber-800 border-amber-200 border", label: "Menunggu Transfer", icon: <ArrowRightLeft size={16} /> },
      COMPLETED: { style: "bg-emerald-100 text-emerald-800 border-emerald-200 border", label: "Selesai", icon: <CheckCircle2 size={16} /> },
      REJECTED: { style: "bg-rose-100 text-rose-800", label: "Ditolak", icon: <X size={16} /> },
    };
    const c = config[status] || { style: "bg-gray-100 text-gray-800", label: status, icon: <AlertCircle size={16} /> };
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide ${c.style}`}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
        <p className="text-gray-500 font-medium">Memuat detail pencairan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 border border-red-100 rounded-2xl max-w-lg mx-auto mt-10">
        <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-bold mb-2">{error || "Terjadi kesalahan"}</h3>
        <button onClick={() => navigate(-1)} className="px-4 py-2 mt-4 bg-white text-red-600 rounded-lg shadow-sm border border-red-200 hover:bg-red-50 transition-colors">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const snap = parseSnapshot(data.amount_snapshot);

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Top Nav */}
      <button 
        onClick={() => navigate('/super-admin/withdraws')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Pencairan
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Detail Transfer Pencairan</h1>
          <p className="text-sm text-gray-500">ID Transaksi: <span className="font-mono">#{data.id}</span></p>
        </div>
        <div>
          {renderStatusBadge(data.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Target Bank & Total */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bank Detail Card (CLEAN WHITE) */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-gray-400 pointer-events-none">
              <Building2 size={140} />
            </div>
            
            <h2 className="text-gray-500 font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-sm border-b border-gray-100 pb-4">
              <Wallet size={18} className="text-amber-500" /> Tujuan Transfer Bank
            </h2>

            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-gray-500 text-sm mb-1 font-medium">Nominal yang harus ditransfer</p>
                <p className="text-5xl font-bold font-mono tracking-tight text-gray-900">
                  {formatRupiah(data.total_idr)}
                </p>
              </div>

              <div className="h-px w-full bg-gray-100 my-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold"><CreditCard size={14}/> Nomor Rekening</p>
                  <p className="text-2xl font-bold font-mono tracking-widest bg-gray-50 text-gray-900 inline-block px-4 py-2 rounded-xl border border-gray-200 shadow-inner">
                    {data.bank_account_number || "-"}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold"><UserCircle size={14}/> Atas Nama</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.bank_account_name || "-"}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold"><Building2 size={14}/> Bank Penerima</p>
                  <p className="text-xl font-bold text-gray-900">
                    {data.bank_name || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign & Fee Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Informasi Kampanye & Rincian</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Judul Kampanye</p>
                  <p className="font-semibold text-gray-900">{data.campaign_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pura Pengaju</p>
                  <p className="font-medium text-gray-800">{data.nama_pura || "-"}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">Rincian Dana Masuk</p>
                {snap ? (
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fiat (Kotor)</span>
                      <span className="font-mono font-medium text-gray-800">{formatRupiah(snap.fiat?.amount_idr)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fee Midtrans</span>
                      <span className="font-mono text-red-500">-{formatRupiah(snap.fiat?.fee_idr)}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 border-t border-gray-200">
                      <span className="text-gray-500">USDT</span>
                      <span className="font-mono font-medium text-gray-800">{formatCrypto(snap.crypto?.amount_usdt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">USDC</span>
                      <span className="font-mono font-medium text-gray-800">{formatCrypto(snap.crypto?.amount_usdc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimasi Fee Kripto</span>
                      <span className="font-mono text-red-500">-{formatRupiah(snap.crypto?.fee_idr)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada snapshot dana.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Action & Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Aksi Transfer</h3>
            </div>
            
            <div className="p-6">
              {data.status === "PENDING_TRANSFER" ? (
                <div className="space-y-5">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
                    Pastikan Anda telah mentransfer sejumlah <strong>{formatRupiah(data.total_idr)}</strong> ke rekening <strong>{data.bank_account_number}</strong>.
                  </div>
                  
                  <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    fileName ? "border-amber-400 bg-amber-50" : "border-gray-300 hover:border-amber-400 hover:bg-amber-50/50"
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setFile(f);
                          setFileName(f.name);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                      {fileName ? (
                        <>
                          <CheckCircle2 className="text-green-500" size={40} />
                          <div>
                            <span className="block text-sm font-bold text-gray-800 line-clamp-1">{fileName}</span>
                            <span className="text-xs text-gray-500 mt-1 block">Klik area ini untuk ganti file</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                            <Upload size={24} />
                          </div>
                          <div>
                            <span className="block text-sm text-gray-700"><span className="font-bold text-amber-600">Pilih File</span> Struk Bukti</span>
                            <span className="text-xs text-gray-400 mt-1 block">JPG, PNG, PDF (Max 10MB)</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitTransfer}
                    disabled={!file || submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin" /> Mengunggah...</>
                    ) : (
                      <><CheckCircle2 size={18} /> Konfirmasi Transfer Selesai</>
                    )}
                  </button>
                </div>
              ) : data.status === "COMPLETED" ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-5">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Transfer Selesai</h4>
                  <p className="text-sm text-gray-500 mb-6 px-4">Pencairan dana telah berhasil dilakukan dan bukti telah diunggah.</p>
                  
                  {data.transfer_proof_cid && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${data.transfer_proof_cid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 hover:border-gray-300 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Lihat Struk Bukti Transfer
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-5">
                    <Clock size={40} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Belum Siap Transfer</h4>
                  <p className="text-sm text-gray-500 px-4">Status pencairan belum mencapai tahap transfer. Proses voting oleh Trustee masih berjalan atau belum dimulai.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
