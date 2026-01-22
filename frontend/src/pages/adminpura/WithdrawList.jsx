import { useEffect, useState } from "react";
import { getWithdraws, syncVotingResult } from "../../api/adminPura.api";
import { 
  RefreshCw, 
  ExternalLink, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Vote, 
  Loader2,
  AlertCircle
} from "lucide-react";

export default function WithdrawList() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [error, setError] = useState(null);

  /* ===============================
     FETCH LIST
  =============================== */
  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const res = await getWithdraws();
      // Handle response structure safety
      const data = res.data?.data || res.data || []; 
      setWithdraws(data);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data withdraw. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  /* ===============================
     SYNC PER ITEM
  =============================== */
  const handleSync = async (id) => {
    try {
      setSyncingId(id);
      await syncVotingResult(id);
      await fetchWithdraws(); // Refresh data setelah sync
    } catch (err) {
      alert("Gagal melakukan sinkronisasi voting. Silakan coba lagi.");
    } finally {
      setSyncingId(null);
    }
  };

  // --- Render Parsed Amount ---
  const renderAmount = (snapshot) => {
    if (!snapshot) return <span className="text-gray-400">-</span>;
    // Regex simple parser
    const usdt = snapshot.match(/USDT:\s*([\d.]+)/)?.[1] || "0";
    const usdc = snapshot.match(/USDC:\s*([\d.]+)/)?.[1] || "0";

    return (
      <div className="flex flex-col gap-1 text-right">
        <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-semibold text-gray-500">USDT</span>
            <span className="font-mono font-bold text-gray-800">{usdt}</span>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-1">
            <span className="text-xs font-semibold text-gray-500">USDC</span>
            <span className="font-mono font-bold text-gray-800">{usdc}</span>
        </div>
      </div>
    );
  };

  // --- Render Status Badge ---
  const renderStatusBadge = (status) => {
    let style = "bg-gray-100 text-gray-600 border-gray-200";
    let icon = <Clock size={12} />;
    let label = status;

    switch (status) {
      case "REQUESTED":
        style = "bg-gray-50 text-gray-600 border-gray-200";
        label = "Menunggu Proses";
        break;
      case "READY_FOR_VOTING":
        style = "bg-amber-50 text-amber-700 border-amber-200";
        icon = <Vote size={12} />;
        label = "Siap Voting";
        break;
      case "VOTING_IN_PROGRESS":
        style = "bg-blue-50 text-blue-700 border-blue-200";
        icon = <Loader2 size={12} className="animate-spin" />;
        label = "Voting Berjalan";
        break;
      case "EXECUTED":
        style = "bg-emerald-50 text-emerald-700 border-emerald-200";
        icon = <CheckCircle2 size={12} />;
        label = "Berhasil Cair";
        break;
      case "REJECTED":
        style = "bg-rose-50 text-rose-700 border-rose-200";
        icon = <XCircle size={12} />;
        label = "Ditolak";
        break;
      default:
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style} uppercase tracking-wide`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Daftar Penarikan Dana</h1>
           <p className="text-sm text-gray-500">Pantau status persetujuan (Voting) dan pencairan dana on-chain.</p>
        </div>
        <button 
            onClick={fetchWithdraws}
            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all"
            title="Refresh Data"
        >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {loading && (
             <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={32} className="animate-spin text-amber-500 mb-2"/>
                <p>Memuat data blockchain...</p>
             </div>
        )}

        {error && (
            <div className="p-6 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {!loading && !error && withdraws.length === 0 && (
             <div className="p-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Wallet size={32} />
                </div>
                <h3 className="font-bold text-gray-700">Belum ada penarikan</h3>
                <p className="text-sm mt-1">Permintaan withdraw yang Anda buat akan muncul di sini.</p>
             </div>
        )}

        {!loading && !error && withdraws.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Nama Kampanye</th>
                  <th className="px-6 py-4 text-right">Jumlah (Snapshot)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi & Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {withdraws.map((wr) => (
                  <tr key={wr.id} className="hover:bg-amber-50/30 transition-colors">
                    
                    {/* Campaign Name */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 text-base line-clamp-2 max-w-xs">
                         {wr.campaign_title || wr.campaign_title_db}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">ID: #{wr.id.substring(0,8)}...</div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      {renderAmount(wr.amount_snapshot)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(wr.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        
                        {/* 1. SYNC BUTTON (Only visible during voting) */}
                        {wr.status === "VOTING_IN_PROGRESS" && (
                          <button
                            onClick={() => handleSync(wr.id)}
                            disabled={syncingId === wr.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                          >
                            <RefreshCw size={12} className={syncingId === wr.id ? "animate-spin" : ""} />
                            {syncingId === wr.id ? "Syncing..." : "Sync Vote"}
                          </button>
                        )}

                        {/* 2. TX HASH LINK (Only if executed) */}
                        {wr.executed_tx_hash ? (
                          <a
                            href={`https://testnet.bscscan.com/tx/${wr.executed_tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all"
                            title="Lihat di Blockchain Explorer"
                          >
                            <ExternalLink size={12} />
                            Lihat TX
                          </a>
                        ) : (
                           // Placeholder agar layout tidak lompat jika tidak ada tombol
                           wr.status !== "VOTING_IN_PROGRESS" && <span className="text-gray-300 text-xs">-</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}