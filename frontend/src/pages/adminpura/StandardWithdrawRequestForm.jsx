import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { requestWithdraw } from "../../api/adminPura.api";
import { fetchPublicCampaignDetail } from "../../api/public.api";
import { proposeWithdraw } from "../../services/blockchain/voting";
import { showError, showSuccess } from "../../utils/notification";
import { 
  ArrowLeft, 
  Wallet, 
  AlertTriangle, 
  Calendar, 
  Lock, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Info,
  Send,
  Banknote
} from "lucide-react";

export default function StandardWithdrawRequestForm({ campaignId, campaign, onchain, offchain }) {
  const navigate = useNavigate();
  const [rateUsdtIdr, setRateUsdtIdr] = useState(0);
  const [rateUsdcIdr, setRateUsdcIdr] = useState(0);
  const [rateLoadedAt, setRateLoadedAt] = useState(null);
  
  // --- State UI ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- Form Inputs ---
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=idr",
          { signal: AbortSignal.timeout(5000) }
        );
        const data = await res.json();
        if (data?.tether?.idr) setRateUsdtIdr(data.tether.idr);
        if (data?.["usd-coin"]?.idr) setRateUsdcIdr(data["usd-coin"].idr);
        setRateLoadedAt(new Date().toISOString());
      } catch (e) {
        console.error("Gagal fetch rate CoinGecko:", e);
        // Fallback ke rate default estimasi jika CoinGecko gagal
        setRateUsdtIdr(16400);
        setRateUsdcIdr(16400);
        setRateLoadedAt(new Date().toISOString());
      }
    };
    fetchRate();
  }, []);

  // 2. LOGIC HELPERS
  const isDeadlinePassed = useMemo(() => {
    if (!campaign) return false;
    if (!campaign.deadline) return true; // if no deadline
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

  // --- FEE CALCULATIONS (per-token rate) ---
  const usdtRaw = formatCryptoRaw(onchain?.balances?.USDT);
  const usdcRaw = formatCryptoRaw(onchain?.balances?.USDC);
  const cryptoGrossIdr = (usdtRaw * rateUsdtIdr) + (usdcRaw * rateUsdcIdr);
  const hasCrypto = (usdtRaw + usdcRaw) > 0;
  const cryptoExchangeFeeIdr = hasCrypto ? 5000 : 0; // Biaya konversi kripto ke IDR
  const cryptoGasFeeIdr = hasCrypto ? 5000 : 0;      // Biaya transaksi blockchain (gas)
  const cryptoFeeIdr = cryptoExchangeFeeIdr + cryptoGasFeeIdr; // Total biaya kripto
  const cryptoNetIdr = Math.max(0, cryptoGrossIdr - cryptoFeeIdr);

  const fiatGrossIdr = Number(offchain?.current_balance || 0);
  const fiatTxCount = offchain?.txCount || 0;
  const fiatFeeIdr = fiatTxCount * 4400; // Fee Midtrans 4.400 per transaksi
  const fiatNetIdr = Math.max(0, fiatGrossIdr - fiatFeeIdr);

  const totalNetIdr = cryptoNetIdr + fiatNetIdr;
  const avgCryptoRate = (rateUsdtIdr + rateUsdcIdr) / 2;

  // Helper File Change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // 3. SUBMIT HANDLER
  const submitWithdraw = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLocked) return;

    if (!reason.trim() || !file) {
      setError("Semua inputan (Rencana Penggunaan Dana dan Dokumen Pendukung) wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("reason", reason || "");
      
      // Append payload values for unified withdraw
      formData.append("crypto_usdt", onchain?.balances?.USDT || "0");
      formData.append("crypto_usdc", onchain?.balances?.USDC || "0");
      formData.append("crypto_fee_idr", cryptoFeeIdr);
      formData.append("crypto_exchange_fee_idr", cryptoExchangeFeeIdr);
      formData.append("crypto_gas_fee_idr", cryptoGasFeeIdr);
      formData.append("fiat_amount_idr", fiatGrossIdr);
      formData.append("fiat_fee_idr", fiatFeeIdr);
      formData.append("total_idr", totalNetIdr);

      // Locked rate — kunci harga saat pengajuan
      formData.append("locked_rate_usdt_idr", rateUsdtIdr);
      formData.append("locked_rate_usdc_idr", rateUsdcIdr);
      formData.append("locked_rate_at", rateLoadedAt || new Date().toISOString());

      formData.append("document", file);

      let proposalId = null;
      if (campaign.id_campaign_onchain) {
        // Panggil MetaMask untuk membuat proposal di blockchain
        proposalId = await proposeWithdraw(campaign.id_campaign_onchain);
        formData.append("proposal_id", proposalId);
      }

      await requestWithdraw(formData);

      // Feedback visual sebelum redirect
      if (proposalId) {
        showSuccess("Berhasil Diajukan", "Permintaan pencairan dana berhasil diajukan dan Proposal Blockchain telah dibuat! Wali Amanat (Trustee) akan segera melakukan voting.");
      } else {
        showSuccess("Berhasil Diajukan", "Permintaan pencairan dana berhasil diajukan!");
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
          <h1 className="text-2xl font-bold text-gray-800">Pengajuan Dana Awal (Pra-Kegiatan)</h1>
          <p className="text-sm text-gray-500">Ajukan pencairan untuk total punia Kripto & Fiat (Midtrans) dan unggah RAB/Estimasi.</p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* STATUS CARDS (LOCKED / WARNING) */}
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
              <Banknote size={18} className="text-amber-500"/> Estimasi Pencairan
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">UNIFIED</span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Crypto Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Punia Kripto (Aset Digital)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saldo USDT</span>
                    <span className="font-mono font-bold">{formatCrypto(onchain?.balances?.USDT)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Saldo USDC</span>
                    <span className="font-mono font-bold">{formatCrypto(onchain?.balances?.USDC)} USDC</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 border-dashed">
                    <span className="text-gray-500">Est. Kotor (Rate ≈{avgCryptoRate ? formatRupiah(Math.round(avgCryptoRate)) : 'Menghitung...'})</span>
                    <span className="font-mono">{formatRupiah(cryptoGrossIdr)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Biaya Konversi Kripto → IDR</span>
                    <span className="font-mono">-{formatRupiah(cryptoExchangeFeeIdr)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Biaya Transaksi Blockchain (Gas)</span>
                    <span className="font-mono">-{formatRupiah(cryptoGasFeeIdr)}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-gray-800">
                    <span>Bersih Crypto</span>
                    <span className="font-mono">{formatRupiah(cryptoNetIdr)}</span>
                  </div>
                </div>
              </div>

              {/* Fiat Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Punia Fiat (Rupiah/Bank)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Masuk</span>
                    <span className="font-mono font-bold">{formatRupiah(fiatGrossIdr)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Est. Fee (4.4k/Tx)</span>
                    <span className="font-mono">-{formatRupiah(fiatFeeIdr)}</span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-100 border-dashed font-bold text-gray-800">
                    <span>Bersih Fiat</span>
                    <span className="font-mono">{formatRupiah(fiatNetIdr)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="block text-sm text-gray-500">Total Estimasi Dana Bersih</span>
                  <span className="block text-xs text-gray-400 mt-1">Yang akan ditransfer Super Admin ke rekening Pura</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600 font-mono">
                  {formatRupiah(totalNetIdr)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORM INPUTS */}
        <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity ${isLocked ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
            
            {/* Reason */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Rencana Penggunaan Dana
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-gray-400"
                    rows={4}
                    placeholder="Jelaskan secara rinci untuk apa dana ini akan digunakan (cth: Pembelian material semen 50 sak)..."
                    disabled={isLocked}
                />
            </div>

            {/* File Upload */}
            <div className="mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Dokumen Bukti (RAB / Invoice)
                </label>
                
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    fileName ? "border-amber-400 bg-amber-50/50" : "border-gray-300 hover:border-amber-400 hover:bg-gray-50"
                }`}>
                    <input 
                        type="file" 
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        disabled={isLocked}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        {fileName ? (
                            <>
                                <CheckCircle2 className="text-green-500" size={24} />
                                <span className="text-sm font-bold text-gray-800">{fileName}</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="text-gray-400" size={24} />
                                <span className="text-sm text-gray-500">
                                    <span className="font-bold text-amber-600">Upload File</span> atau drag and drop
                                </span>
                                <span className="text-xs text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 3. ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
                Batal
            </button>

            <button
                type="submit"
                disabled={loading || isLocked}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" /> Mengajukan...
                    </>
                ) : (
                    <>
                        <Send size={18} /> Ajukan Request
                    </>
                )}
            </button>
        </div>

      </form>
    </div>
  );
}