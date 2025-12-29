import { useEffect, useState } from "react";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  getReports,
  approveReport,
  rejectReport,
} from "../../services/superAdminApi";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

export default function SuperAdminDashboard() {
  const { token, logoutAdmin } = useAdminAuth();

  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res =
        status === "ALL"
          ? await getReports(token)
          : await getReports(token, status);
      setReports(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [status]);

  const handleApprove = async (id) => {
    if (!confirm("Setujui pengajuan ini?")) return;
    await approveReport(id, token);
    fetchReports();
  };

  const handleReject = async (id) => {
    const note = prompt("Masukkan alasan penolakan:");
    if (!note) return;
    await rejectReport(id, note, token);
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow border p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">
            Dashboard Super Admin
          </h1>
          <button
            onClick={logoutAdmin}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                ${
                  status === tab
                    ? "bg-amber-400 text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <p>Memuat data...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && reports.length === 0 && (
          <p className="text-slate-500">Tidak ada data.</p>
        )}

        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 border">Nama Pura</th>
                  <th className="p-3 border">Kontak</th>
                  <th className="p-3 border">Wallet</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">File</th>
                  <th className="p-3 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 border">{r.nama_pura}</td>
                    <td className="p-3 border">{r.kontak_telepon}</td>
                    <td className="p-3 border text-xs">
                      {r.address_pengaju}
                    </td>
                    <td className="p-3 border">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            r.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : r.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        `}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 border">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_hash}`}
                        target="_blank"
                        className="text-amber-600 hover:underline"
                      >
                        Lihat
                      </a>
                    </td>
                    <td className="p-3 border space-x-2">
                      {r.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-3 py-1 rounded bg-green-100 text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="px-3 py-1 rounded bg-red-100 text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status !== "PENDING" && (
                        <span className="text-slate-400 italic">
                          Tidak ada aksi
                        </span>
                      )}
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
