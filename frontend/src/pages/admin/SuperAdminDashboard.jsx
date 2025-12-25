import { useEffect, useState } from "react";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  getPengajuanList,
  approvePengajuan,
  rejectPengajuan,
} from "../../services/superAdminApi";

export default function SuperAdminDashboard() {
  const { token, logoutAdmin } = useAdminAuth();
  const [pengajuan, setPengajuan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPengajuanList(token);
      setPengajuan(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm("Setujui pengajuan ini?")) return;

    try {
      await approvePengajuan(id, token);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    const note = prompt("Alasan penolakan:");
    if (!note) return;

    try {
      await rejectPengajuan(id, note, token);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-6">Memuat data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow border p-6">

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 border">Nama Pura</th>
                <th className="p-3 border">Kontak</th>
                <th className="p-3 border">Wallet</th>
                <th className="p-3 border">File</th>
                <th className="p-3 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pengajuan.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    Tidak ada pengajuan
                  </td>
                </tr>
              )}

              {pengajuan.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 border">{item.nama_pura}</td>
                  <td className="p-3 border">{item.kontak_telepon}</td>
                  <td className="p-3 border text-xs">{item.address_pengaju}</td>
                  <td className="p-3 border">
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${item.ipfs_hash}`}
                      target="_blank"
                      className="text-amber-600 hover:underline"
                    >
                      Lihat
                    </a>
                  </td>
                  <td className="p-3 border space-x-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
