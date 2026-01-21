import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { requestWithdraw } from "../../api/adminPura.api";
import { fetchPublicCampaignDetail } from "../../api/public.api";

export default function WithdrawRequestForm() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  // State Data
  const [onchain, setOnchain] = useState({ balances: { USDT: "0", USDC: "0" } });
  const [campaign, setCampaign] = useState(null); // Butuh data campaign untuk cek deadline
  
  // State UI
  const [isFetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form Inputs
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);

  // 1. FETCH DATA (Campaign & Balances)
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

  // 2. LOGIC: SNAPSHOT BALANCE
  // Backend menyimpan ini sebagai Text/String di DB untuk pelaporan
  const amountSnapshot = useMemo(() => {
    const usdt = onchain?.balances?.USDT || "0";
    const usdc = onchain?.balances?.USDC || "0";
    return `USDT: ${usdt}, USDC: ${usdc}`;
  }, [onchain]);

  // 3. LOGIC: CEK DEADLINE (Sesuai Backend)
  const isDeadlinePassed = useMemo(() => {
    if (!campaign) return false;
    const deadline = new Date(campaign.deadline);
    const now = new Date();
    return now >= deadline;
  }, [campaign]);

  // 4. LOGIC: CEK STATUS (Sesuai Backend)
  const isAlreadyRequested = campaign?.status === "REQUESTED";

  const submitWithdraw = async (e) => {
    e.preventDefault();
    setError(null);

    // Validasi Frontend sebelum kirim ke Backend
    if (!isDeadlinePassed) {
      setError("Campaign belum selesai (Deadline belum terlewati).");
      return;
    }

    if (!file) {
      setError("Dokumen pendukung wajib diunggah.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      
      // Mengirim string snapshot ke backend
      // Pastikan kolom 'amount' di tabel withdraw_requests tipe-nya TEXT/VARCHAR
      formData.append("amount", amountSnapshot); 
      
      formData.append("reason", reason || "");
      formData.append("document", file);

      await requestWithdraw(formData);

      alert("Permintaan withdraw berhasil diajukan & menunggu verifikasi.");
      navigate("/admin/pura/withdraws");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Gagal mengajukan withdraw");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) return <div className="p-6">Loading data...</div>;
  if (!campaign) return <div className="p-6">Campaign tidak ditemukan.</div>;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-2">Request Withdraw (On-Chain)</h1>

      {/* INFO BOX */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">Informasi Penting:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Dana di bawah adalah <strong>Snapshot Saldo</strong> saat ini.</li>
          <li>Withdraw hanya bisa diajukan setelah deadline: <strong>{new Date(campaign.deadline).toLocaleDateString()}</strong>.</li>
          <li>Request ini akan diverifikasi Trustee sebelum menjadi Proposal On-chain.</li>
        </ul>
      </div>

      {/* BALANCE PREVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <StatCard label="Saldo USDT (Snapshot)" value={onchain?.balances?.USDT || "0"} />
        <StatCard label="Saldo USDC (Snapshot)" value={onchain?.balances?.USDC || "0"} />
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* WARNING DEADLINE */}
      {!isDeadlinePassed && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
          ⚠️ <strong>Belum bisa withdraw.</strong> Campaign ini masih berjalan hingga {new Date(campaign.deadline).toLocaleDateString()}.
        </div>
      )}

      {/* WARNING STATUS */}
      {isAlreadyRequested && (
        <div className="mb-4 p-3 bg-orange-100 text-orange-800 rounded border border-orange-200">
          ⚠️ Withdraw sudah diajukan sebelumnya (Status: REQUESTED).
        </div>
      )}

      <form onSubmit={submitWithdraw} className="space-y-4">
        {/* REASON */}
        <div>
          <label className="block text-sm font-medium mb-1">Rencana Penggunaan Dana</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Jelaskan detail penggunaan dana..."
            disabled={!isDeadlinePassed || isAlreadyRequested}
          />
        </div>

        {/* FILE */}
        <div>
          <label className="block text-sm font-medium mb-1">Dokumen Bukti (PDF/Image)</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files[0])}
            required
            disabled={!isDeadlinePassed || isAlreadyRequested}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading || !isDeadlinePassed || isAlreadyRequested}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Mengajukan..." : "Ajukan Request"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}