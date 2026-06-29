import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithdrawTransfers } from "../../api/superAdmin.api";
import {
  Wallet,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRightLeft,
  ExternalLink,
  ArrowRight,
  X
} from "lucide-react";

export default function WithdrawTransfers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithdrawTransfers();
      setRows(res.data.data || []);
    } catch (e) {
      setError(e.message || "Gagal memuat data pencairan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Parse JSON amount_snapshot
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

  // Status badge
  const renderStatusBadge = (status) => {
    const config = {
      REQUESTED: {
        style: "bg-gray-50 text-gray-600 border-gray-200",
        icon: <Clock size={12} />,
        label: "Menunggu Voting",
      },
      VOTING_IN_PROGRESS: {
        style: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Loader2 size={12} className="animate-spin" />,
        label: "Voting Berjalan",
      },
      PENDING_TRANSFER: {
        style: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <ArrowRightLeft size={12} />,
        label: "Menunggu Transfer",
      },
      COMPLETED: {
        style: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 size={12} />,
        label: "Selesai",
      },
      REJECTED: {
        style: "bg-rose-50 text-rose-700 border-rose-200",
        icon: <X size={12} />,
        label: "Ditolak",
      },
    };

    const c = config[status] || {
      style: "bg-gray-100 text-gray-600 border-gray-200",
      icon: <Clock size={12} />,
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.style} uppercase tracking-wide`}
      >
        {c.icon}
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Pencairan Dana
          </h1>
          <p className="text-sm text-gray-500">
            Kelola transfer dana ke rekening bank Admin Pura setelah voting
            disetujui.
          </p>
        </div>
        <button
          onClick={loadData}
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
            <Loader2 size={32} className="animate-spin text-amber-500 mb-2" />
            <p>Memuat data pencairan...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Wallet size={32} />
            </div>
            <h3 className="font-bold text-gray-700">
              Belum ada pencairan dana
            </h3>
            <p className="text-sm mt-1">
              Permintaan pencairan yang sudah disetujui akan muncul di sini.
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Kegiatan / Pura</th>
                  <th className="px-6 py-4 text-right">
                    Total Bersih (Rp)
                  </th>
                  <th className="px-6 py-4 text-center">Rincian Fee</th>
                  <th className="px-6 py-4 text-center">Rekening Tujuan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((wr) => {
                  const snap = parseSnapshot(wr.amount_snapshot);

                  return (
                    <tr
                      key={wr.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      {/* Campaign & Pura */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800 text-base line-clamp-2 max-w-xs">
                          {wr.campaign_title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {wr.nama_pura || "-"}
                        </div>
                      </td>

                      {/* Total IDR */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-gray-900 font-mono">
                          {formatRupiah(wr.total_idr)}
                        </span>
                      </td>

                      {/* Fee Breakdown */}
                      <td className="px-6 py-4 text-center">
                        {snap ? (
                          <div className="text-xs space-y-1 text-left inline-block">
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">
                                Fiat (Midtrans):
                              </span>
                              <span className="font-mono">
                                {formatRupiah(snap.fiat?.amount_idr)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">
                                Fee Midtrans:
                              </span>
                              <span className="font-mono text-red-500">
                                -{formatRupiah(snap.fiat?.fee_idr)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-gray-100 pt-1">
                              <span className="text-gray-500">
                                USDT:
                              </span>
                              <span className="font-mono">
                                {formatCrypto(snap.crypto?.amount_usdt)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">
                                USDC:
                              </span>
                              <span className="font-mono">
                                {formatCrypto(snap.crypto?.amount_usdc)}
                              </span>
                            </div>
                            {snap.crypto?.fee_breakdown ? (
                              <>
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-500">
                                    Konversi Kripto:
                                  </span>
                                  <span className="font-mono text-red-500">
                                    -{formatRupiah(snap.crypto.fee_breakdown.exchange_fee_idr)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-500">
                                    Gas Blockchain:
                                  </span>
                                  <span className="font-mono text-red-500">
                                    -{formatRupiah(snap.crypto.fee_breakdown.gas_fee_idr)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between gap-4">
                                <span className="text-gray-500">
                                  Biaya Kripto:
                                </span>
                                <span className="font-mono text-red-500">
                                  -{formatRupiah(snap.crypto?.fee_idr)}
                                </span>
                              </div>
                            )}
                            {snap.locked_rate && (snap.locked_rate.usdt_idr > 0 || snap.locked_rate.usdc_idr > 0) && (
                              <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
                                <span className="text-indigo-600 flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                  Kurs Terkunci:
                                </span>
                                <span className="font-mono text-indigo-600">
                                  Rp {Number(snap.locked_rate.usdt_idr).toLocaleString("id-ID")}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Rekening Tujuan */}
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-gray-700">
                            {wr.bank_name || "-"}
                          </div>
                          <div className="text-gray-500 font-mono">
                            {wr.bank_account_number || "-"}
                          </div>
                          <div className="text-gray-400">
                            a.n. {wr.bank_account_name || "-"}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {renderStatusBadge(wr.status)}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/admin/super/withdraws/${wr.id}`)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            wr.status === "PENDING_TRANSFER" 
                              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {wr.status === "PENDING_TRANSFER" ? "Selesaikan Transfer" : "Lihat Detail"}
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
}
