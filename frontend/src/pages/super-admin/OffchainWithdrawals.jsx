import { useEffect, useState } from "react";
import {
  fetchOffchainWithdrawals,
  updateOffchainStatus,
} from "../../api/superAdmin.api";
import useToast from "../../hooks/useToast";

export default function OffchainWithdrawals() {
  const { success, error, confirm } = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchOffchainWithdrawals();
      setRows(res.data.data);
    } catch (e) {
      setErrMsg(e.message || "Gagal memuat pencairan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onChangeStatus = (id, next) => {
    confirm(`Ubah status pencairan menjadi ${next}?`, async () => {
      try {
        await updateOffchainStatus(id, { status: next });
        success("Status pencairan diperbarui");
        loadData();
      } catch (e) {
        error(e.message || "Gagal memperbarui status");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Offchain Withdrawals
        </h1>
        <p className="text-sm text-slate-500">
          Kelola pencairan dana ke rekening bank
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading && <p className="text-sm text-slate-500">Memuat...</p>}
        {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}

        {!loading && rows.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada data.</p>
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 border text-left">Campaign</th>
                  <th className="p-3 border">Jumlah</th>
                  <th className="p-3 border">Rekening</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-3 border">{w.campaign_title}</td>
                    <td className="p-3 border text-right">
                      Rp {Number(w.amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 border text-xs">
                      <div><b>Bank:</b> {w.bank_name}</div>
                      <div><b>No:</b> {w.account_number}</div>
                      <div><b>Nama:</b> {w.account_name}</div>
                    </td>
                    <td className="p-3 border text-center">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="p-3 border text-center">
                      {isFinal(w.status) ? (
                        <span className="text-xs text-slate-400 italic">Final</span>
                      ) : (
                        <select
                          value={w.status}
                          onChange={(e) => onChangeStatus(w.id, e.target.value)}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          <option value="REQUESTED">REQUESTED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="DONE">DONE</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
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

function isFinal(status) {
  return status === "DONE" || status === "REJECTED";
}

function StatusBadge({ status }) {
  const map = {
    REQUESTED: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    DONE: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}
