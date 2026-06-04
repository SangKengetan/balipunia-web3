import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { unifiedWithdrawReport } from "../../api/adminPura.api";
import { proposeWithdraw } from "../../services/blockchain/voting";
import { showError, showSuccess } from "../../utils/notification";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Lock, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Info,
  Send,
  Banknote,
  FileText,
  ImagePlus,
  X,
  AlertCircle
} from "lucide-react";

export default function UnifiedWithdrawRequestForm({ campaignId, campaign, onchain, offchain }) {
  const navigate = useNavigate();

  const [cryptoRateIdr, setCryptoRateIdr] = useState(0);
  
  // --- State UI ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- Form Inputs ---
  const [description, setDescription] = useState("");
  const [manualIncome, setManualIncome] = useState("");
  const [peturunanIncome, setPeturunanIncome] = useState("");
  const [totalExpense, setTotalExpense] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
        const rateData = await rateRes.json();
        if (rateData?.rates?.IDR) {
          setCryptoRateIdr(rateData.rates.IDR);
        }
      } catch (e) {
        console.error("Gagal fetch rate USD to IDR:", e);
      }
    };
    fetchRate();
  }, []);

  // 2. LOGIC HELPERS
  const isDeadlinePassed = useMemo(() => {
    if (!campaign) return false;
    if (!campaign.deadline) return true;
    const deadline = new Date(campaign.deadline);
    const now = new Date();
    return now >= deadline;
  }, [campaign]);

  const isAlreadyRequested = [
    "REQUESTED",
    "VOTING_IN_PROGRESS",
    "PENDING_TRANSFER",
    "COMPLETED",
    "EXECUTED"
  ].includes(campaign?.status);

  const isLocked = !isDeadlinePassed || isAlreadyRequested;

  // Helper Format
  const formatCryptoRaw = (val) => {
    if (!val) return 0;
    return parseFloat(val) / 1e18;
  };
  
  const formatCrypto = (val) => {
    return formatCryptoRaw(val).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatRupiah = (val) => {
    return `Rp ${Number(val).toLocaleString("id-ID")}`;
  };

  // --- FEE CALCULATIONS ---
  const usdtRaw = formatCryptoRaw(onchain?.balances?.USDT);
  const usdcRaw = formatCryptoRaw(onchain?.balances?.USDC);
  const totalCryptoUsd = usdtRaw + usdcRaw;
  const cryptoGrossIdr = totalCryptoUsd * cryptoRateIdr;
  const cryptoFeeIdr = totalCryptoUsd > 0 ? 10000 : 0; 
  const cryptoNetIdr = Math.max(0, cryptoGrossIdr - cryptoFeeIdr);

  const fiatGrossIdr = Number(offchain?.total || 0);
  const fiatTxCount = offchain?.txCount || 0;
  const fiatFeeIdr = fiatTxCount * 4400; 
  const fiatNetIdr = Math.max(0, fiatGrossIdr - fiatFeeIdr);

  const totalNetIdr = cryptoNetIdr + fiatNetIdr;

  // Helper File Change
  const handleFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);

    if (mediaFiles.length + newFiles.length > 10) {
      showError("Maksimal 10 file per laporan");
      return;
    }

    for (const f of newFiles) {
      if (f.size > 5 * 1024 * 1024) {
        showError(`File "${f.name}" terlalu besar (Maks. 5MB per file)`);
        return;
      }
    }

    const withPreviews = newFiles.map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setMediaFiles(prev => [...prev, ...withPreviews]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // 3. SUBMIT HANDLER
  const submitWithdraw = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLocked) return;

    if (!description.trim() || mediaFiles.length === 0 || !totalExpense) {
      setError("Semua inputan wajib diisi dan minimal 1 file harus diunggah.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("reason", description);
      formData.append("description", description);
      
      formData.append("crypto_usdt", onchain?.balances?.USDT || "0");
      formData.append("crypto_usdc", onchain?.balances?.USDC || "0");
      formData.append("crypto_fee_idr", cryptoFeeIdr);
      formData.append("fiat_amount_idr", fiatGrossIdr);
      formData.append("fiat_fee_idr", fiatFeeIdr);
      formData.append("total_idr", totalNetIdr);

      // Income Breakdown
      const incSystem = totalNetIdr;
      const incOutside = Number(manualIncome) || 0;
      const incPeturunan = Number(peturunanIncome) || 0;
      const totalIncome = incSystem + incOutside + incPeturunan;
      
      formData.append("total_income", totalIncome);
      formData.append("income_system", incSystem);
      formData.append("income_outside", incOutside);
      formData.append("income_peturunan", incPeturunan);
      formData.append("total_expense", totalExpense);

      for (const item of mediaFiles) {
        formData.append("media", item.file);
      }

      let proposalId = null;
      if (campaign.id_campaign_onchain) {
        proposalId = await proposeWithdraw(campaign.id_campaign_onchain);
        formData.append("proposal_id", proposalId);
      }

      await unifiedWithdrawReport(formData);

      if (proposalId) {
        showSuccess("Berhasil Diajukan", "Laporan dan Pencairan dana berhasil diajukan dan Proposal Blockchain telah dibuat! Wali Amanat (Trustee) akan segera melakukan voting.");
      } else {
        showSuccess("Berhasil Diajukan", "Laporan dan Pencairan dana berhasil diajukan!");
      }
      navigate("/admin/pura/withdraws");

    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.message || "Gagal mengajukan pencairan dana");
      showError("Gagal Mengajukan", err.message || err.response?.data?.message || "Gagal mengajukan pencairan dana", "Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 font-sans px-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-amber-600 transition-colors shadow-sm text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lapor & Cairkan Dana (Pasca-Kegiatan)</h1>
          <p className="text-sm text-gray-500">Laporkan rincian pengeluaran sekaligus ajukan pencairan ke sistem terpadu.</p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* STATUS CARDS */}
      <div className="space-y-4 mb-8">
        {!isDeadlinePassed && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3 text-yellow-800 shadow-sm">
                <div className="p-2 bg-yellow-100 rounded-full">
                    <Lock size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Periode Locked</h3>
                    <p className="text-xs mt-0.5">
                        Withdraw baru bisa dilakukan setelah deadline: <span className="font-mono font-semibold">{new Date(campaign.deadline).toLocaleDateString('id-ID')}</span>
                    </p>
                </div>
            </div>
        )}

        {isAlreadyRequested && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-800 shadow-sm">
                <div className="p-2 bg-blue-100 rounded-full">
                    <Info size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Pencairan Sedang Diproses</h3>
                    <p className="text-xs mt-0.5">
                        Permintaan pencairan dana untuk kegiatan ini sudah pernah diajukan. Status saat ini: {campaign.status}.
                    </p>
                </div>
            </div>
        )}
      </div>

      <form onSubmit={submitWithdraw} className="space-y-6">
        
        {/* 1. SNAPSHOT BALANCE CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Banknote size={18} className="text-amber-500"/> Estimasi Dana Punia (Dari Sistem)
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">OTOMATIS</span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Donasi Kripto (Aset Digital)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saldo USDT & USDC</span>
                    <span className="font-mono font-bold">${formatCrypto(totalCryptoUsd)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Est. Fee Jaringan</span>
                    <span className="font-mono">-{formatRupiah(cryptoFeeIdr)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-gray-800">
                    <span>Bersih Crypto</span>
                    <span className="font-mono">{formatRupiah(cryptoNetIdr)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Donasi Fiat (Rupiah/Bank)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Masuk</span>
                    <span className="font-mono font-bold">{formatRupiah(fiatGrossIdr)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Est. Fee</span>
                    <span className="font-mono">-{formatRupiah(fiatFeeIdr)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-gray-800">
                    <span>Bersih Fiat</span>
                    <span className="font-mono">{formatRupiah(fiatNetIdr)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="block text-sm text-gray-500">Total Pencairan Dana</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600 font-mono">
                  {formatRupiah(totalNetIdr)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORM INPUTS (LPJ) */}
        <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity ${isLocked ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <FileText size={18} className="text-amber-500" />
                <h2>Detail Pelaksanaan Upacara</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Kegiatan <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-gray-400"
                  rows={4}
                  placeholder="Ceritakan pelaksanaan upacara dan penggunaan dana..."
                  disabled={isLocked}
                />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <AlertCircle size={18} className="text-amber-500" />
                <h2>Rincian Keuangan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dana Punia Dari Sistem <span className="text-emerald-600 text-xs font-bold">(Otomatis)</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-400 font-bold text-sm">Rp</span></div>
                    <input type="text" readOnly value={new Intl.NumberFormat('id-ID').format(totalNetIdr)} className="w-full rounded-xl border border-gray-300 bg-gray-50 pl-11 pr-4 py-3 text-sm outline-none font-mono font-medium text-gray-500 cursor-not-allowed" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Punia Diluar Sistem <span className="text-emerald-600 text-xs font-bold">(Opsional)</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-400 font-bold text-sm">Rp</span></div>
                    <input type="number" value={manualIncome} onChange={(e) => setManualIncome(e.target.value)} disabled={isLocked} className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-medium text-gray-700" placeholder="0" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dana Peturunan Wali <span className="text-emerald-600 text-xs font-bold">(Opsional)</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-400 font-bold text-sm">Rp</span></div>
                    <input type="number" value={peturunanIncome} onChange={(e) => setPeturunanIncome(e.target.value)} disabled={isLocked} className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-medium text-gray-700" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Pengeluaran <span className="text-rose-600 text-xs font-bold">(Wajib)</span></label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-gray-400 font-bold text-sm">Rp</span></div>
                    <input type="number" required value={totalExpense} onChange={(e) => setTotalExpense(e.target.value)} disabled={isLocked} className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-mono font-medium text-gray-700" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold pb-2 border-b border-gray-100">
                <ImagePlus size={18} className="text-amber-500" />
                <h2>Dokumentasi Foto & Bukti (Nota) <span className="text-red-500">*</span></h2>
              </div>
              <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${mediaFiles.length > 0 ? "border-amber-400 bg-amber-50/50" : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"}`}>
                <input type="file" accept=".pdf,image/*" multiple onChange={handleFilesChange} disabled={isLocked} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <UploadCloud className="text-gray-400" size={24} />
                  <span className="text-sm text-gray-500"><span className="font-bold text-amber-600">Klik untuk upload</span> atau drag and drop</span>
                  <span className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB per file, Max 10 file)</span>
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                  {mediaFiles.map((item, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
                      {item.preview ? (
                        <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400"><FileText size={24} /><span className="text-[10px] mt-1 px-1 truncate max-w-full">{item.file.name}</span></div>
                      )}
                      <button type="button" onClick={() => removeFile(idx)} className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-1 text-blue-500 mt-0.5"><AlertCircle size={16} /></div>
              <div className="text-xs text-blue-700 leading-relaxed">
                <strong>Catatan Transparansi:</strong> Data keuangan dan foto ini akan dibungkus menjadi <strong>JSON Metadata</strong> dan di-hash ke jaringan blockchain IPFS untuk transparansi publik yang tidak dapat diubah (Immutable).
              </div>
            </div>

        </div>

        {/* 3. ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">Batal</button>
            <button type="submit" disabled={loading || isLocked} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Mengajukan...</> : <><Send size={18} /> Ajukan & Lapor</>}
            </button>
        </div>

      </form>
    </div>
  );
}
