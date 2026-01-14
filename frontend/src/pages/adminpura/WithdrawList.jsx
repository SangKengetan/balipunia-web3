import { useEffect, useState } from "react";
import { getWithdraws, syncWithdraws } from "../../api/adminPura.api";

export default function WithdrawList() {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const res = await getWithdraws();
      setWithdraws(res.data);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data withdraw");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncWithdraws();
      await fetchWithdraws();
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan sync withdraw");
    } finally {
      setSyncing(false);
    }
  };

  const renderStatus = (wr) => {
    if (wr.status === "EXECUTED") {
      return <span className="text-green-600 font-medium">EXECUTED</span>;
    }

    if (!wr.voting) {
      return <span className="text-gray-500">No Voting</span>;
    }

    if (!wr.voting.finalized) {
      return <span className="text-yellow-600">Menunggu Voting</span>;
    }

    if (wr.voting.executed) {
      return <span className="text-green-600 font-medium">Disetujui</span>;
    }

    return <span className="text-red-600 font-medium">Ditolak</span>;
  };

  if (loading) {
    return <div className="p-6">Loading withdraws...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">
          Daftar Withdraw Campaign
        </h1>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Refresh Status"}
        </button>
      </div>

      {withdraws.length === 0 ? (
        <div className="text-gray-500">
          Belum ada permintaan withdraw.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Campaign</th>
                <th className="border px-3 py-2 text-right">Amount</th>
                <th className="border px-3 py-2 text-center">Status</th>
                <th className="border px-3 py-2 text-center">Voting</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((wr) => (
                <tr key={wr.id}>
                  <td className="border px-3 py-2">
                    {wr.campaign_title || wr.campaign_title_db}
                  </td>

                  <td className="border px-3 py-2 text-right">
                    {Number(wr.amount).toLocaleString("id-ID")}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {wr.status}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {renderStatus(wr)}
                    {wr.voting && (
                      <div className="text-xs text-gray-500 mt-1">
                        YES: {wr.voting.yesVotes} | NO: {wr.voting.noVotes}
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
