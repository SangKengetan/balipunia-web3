import { useEffect, useState } from "react";
import { getWithdraws, syncVotingResult } from "../../api/adminPura.api";


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
      setWithdraws(res.data ?? res);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data withdraw");
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
      await fetchWithdraws();
    } catch (err) {
      alert("Gagal sync voting");
    } finally {
      setSyncingId(null);
    }
  };

  /* ===============================
     STATUS BADGE
  =============================== */
  const renderStatusBadge = (status) => {
    const map = {
      REQUESTED: "bg-gray-200 text-gray-700",
      READY_FOR_VOTING: "bg-yellow-200 text-yellow-800",
      VOTING_IN_PROGRESS: "bg-blue-200 text-blue-800",
      EXECUTED: "bg-green-200 text-green-800",
      REJECTED: "bg-red-200 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          map[status] || "bg-gray-100"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6">Loading withdraws...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Daftar Withdraw Campaign
      </h1>

      {withdraws.length === 0 ? (
        <div className="text-gray-500">
          Belum ada permintaan withdraw.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Campaign</th>
                <th className="border px-3 py-2 text-right">Amount</th>
                <th className="border px-3 py-2 text-center">Status</th>
                <th className="border px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((wr) => (
                <tr key={wr.id}>
                  {/* CAMPAIGN */}
                  <td className="border px-3 py-2">
                    {wr.campaign_title || wr.campaign_title_db}
                  </td>

                  {/* AMOUNT SNAPSHOT */}
                  <td className="border px-3 py-2 text-right">
                    {renderAmountSnapshot(wr.amount_snapshot)}
                  </td>

                  {/* STATUS */}
                  <td className="border px-3 py-2 text-center">
                    {renderStatusBadge(wr.status)}
                  </td>

                  {/* ACTION */}
                  <td className="border px-3 py-2 text-center space-y-1">
                    {/* SYNC BUTTON */}
                    {wr.status === "VOTING_IN_PROGRESS" && (
                      <button
                        onClick={() => handleSync(wr.id)}
                        disabled={syncingId === wr.id}
                        className="px-3 py-1 bg-gray-800 text-white rounded text-xs disabled:opacity-50"
                      >
                        {syncingId === wr.id ? "Syncing..." : "Sync"}
                      </button>
                    )}

                    {/* TX HASH */}
                    {wr.executed_tx_hash && (
                      <div>
                        <a
                          href={`https://bscscan.com/tx/${wr.executed_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-xs"
                        >
                          Lihat Tx
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===============================
   HELPERS
=============================== */
function renderAmountSnapshot(snapshot) {
  if (!snapshot) return "-";
  const usdt = snapshot.match(/USDT:\s*([\d.]+)/)?.[1] || "0";
  const usdc = snapshot.match(/USDC:\s*([\d.]+)/)?.[1] || "0";
  return (
    <div className="text-right">
      <div>USDT: {usdt}</div>
      <div>USDC: {usdc}</div>
    </div>
  );
}
