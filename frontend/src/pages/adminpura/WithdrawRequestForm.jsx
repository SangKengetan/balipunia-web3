import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { requestWithdraw } from "../../api/adminPura.api";
import { fetchPublicCampaignDetail } from "../../api/public.api";
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
  Send
} from "lucide-react";

export default function WithdrawRequestForm() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  // --- State Data ---
  const [onchain, setOnchain] = useState({ balances: { USDT: "0", USDC: "0" } });
  const [campaign, setCampaign] = useState(null);
  
  // --- State UI ---
  const [isFetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // --- Form Inputs ---
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // 1. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const res = await fetchPublicCampaignDetail(campaignId);
        const data = res?.data || res;

        if (data.campaign) setCampaign(data.campaign);
        if (data.onchain) setOnchain(data.onchain);

      } catch (err) {
        console.error("Gagal ambil data:", err);
        setError("Gagal memuat data campaign.");
      } finally {
        setIsFetching(false);
      }
    };

    if (campaignId) fetchData();
  }, [campaignId]);

  // 2. LOGIC HELPERS
  const amountSnapshot = useMemo(() => {
    const usdt = onchain?.balances?.USDT || "0";
    const usdc = onchain?.balances?.USDC || "0";
    return `USDT: ${usdt}, USDC: ${usdc}`;
  }, [onchain]);

  const isDeadlinePassed = useMemo(() => {
    if (!campaign) return false;
    const deadline = new Date(campaign.deadline);
    const now = new Date();
    return now >= deadline;
  }, [campaign]);

  const isAlreadyRequested = campaign?.status === "REQUESTED";
  const isLocked = !isDeadlinePassed || isAlreadyRequested;

  // Helper Format Crypto Display
  const formatCrypto = (val) => {
    if (!val) return "0.00";
    return (parseFloat(val) / 1000000).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

    if (!file) {
      setError("Dokumen pendukung (RAB/Bukti) wajib diunggah.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("amount", amountSnapshot); 
      formData.append("reason", reason || "");
      formData.append("document", file);

      await requestWithdraw(formData);

      // Feedback visual sebelum redirect
      alert("Permintaan withdraw berhasil diajukan! Trustee akan segera melakukan voting.");
      navigate("/admin/pura/withdraws");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Gagal mengajukan withdraw");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
    );
  }

  if (!campaign) return <div className="p-8 text-center">Campaign tidak ditemukan.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 font-sans px-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-amber-600 transition-colors shadow-sm text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Request Withdraw</h1>
          <p className="text-sm text-gray-500">Ajukan pencairan dana dari Smart Contract (On-Chain).</p>
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
                    <h3 className="font-bold text-sm">Sedang Dalam Proses</h3>
                    <p className="text-xs mt-0.5">
                        Permintaan withdraw untuk campaign ini sudah diajukan sebelumnya.
                    </p>
                </div>
            </div>
        )}
      </div>

      <form onSubmit={submitWithdraw} className="space-y-6">
        
        {/* 1. SNAPSHOT BALANCE CARD */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-gray-700">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 opacity-10">
                <Wallet size={120} />
            </div>

            <div className="relative z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Wallet size={14}/> Snapshot Saldo
                </h3>
                
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">USDT Balance</p>
                        <p className="text-2xl font-mono font-bold text-amber-400">
                            ${formatCrypto(onchain?.balances?.USDT)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">USDC Balance</p>
                        <p className="text-2xl font-mono font-bold text-blue-400">
                            ${formatCrypto(onchain?.balances?.USDC)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 bg-gray-800/50 w-fit px-2 py-1 rounded">
                        <Info size={10} />
                        Nominal ini akan dikunci dalam proposal voting Trustee.
                    </p>
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