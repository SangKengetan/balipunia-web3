import { useEffect, useMemo, useState } from "react";
import { getTrusteeWithdraws } from "../../api/trustee.api";
import { useNavigate } from "react-router-dom";

/* ===============================
   STATUS STYLE
================================ */
const STATUS_COLOR = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  READY_FOR_VOTING: "bg-blue-100 text-blue-800",
  VOTING: "bg-purple-100 text-purple-800",
  EXECUTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function TrusteeWithdrawDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ===============================
     FETCH DATA
  ================================ */
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getTrusteeWithdraws();
        setData(res.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ===============================
     SUMMARY COUNT
  ================================ */
  const summary = useMemo(() => {
    const counts = {
      REQUESTED: 0,
      READY_FOR_VOTING: 0,
      VOTING: 0,
    };

    data.forEach((w) => {
      if (counts[w.status] !== undefined) {
        counts[w.status]++;
      }
    });

    return counts;
  }, [data]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <h1 className="text-xl font-semibold mb-2">
        Trustee Withdraw Dashboard
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Halaman ini menampilkan ringkasan dan daftar permintaan withdraw
        yang membutuhkan keputusan trustee.
      </p>

      {/* ===============================
          SUMMARY
      ================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Menunggu Review"
          value={summary.REQUESTED}
          color="bg-yellow-50"
        />
        <SummaryCard
          label="Siap Voting"
          value={summary.READY_FOR_VOTING}
          color="bg-blue-50"
        />
        <SummaryCard
          label="Sedang Voting"
          value={summary.VOTING}
          color="bg-purple-50"
        />
      </div>

      {/* ===============================
          WITHDRAW LIST
      ================================ */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Campaign</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan="3"
                className="border px-4 py-6 text-center text-gray-500"
              >
                Tidak ada permintaan withdraw
              </td>
            </tr>
          )}

          {data.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">
                <div className="font-medium">{w.campaign_title}</div>
                <div className="text-xs text-gray-500">
                  ID: {w.id}
                </div>
              </td>

              <td className="border px-3 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLOR[w.status]}`}
                >
                  {w.status}
                </span>
              </td>

              <td className="border px-3 py-2">
                <button
                  onClick={() =>
                    navigate(`/admin/trustee/withdraw/${w.id}`)
                  }
                  className="text-blue-600 underline text-sm"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===============================
   SUMMARY CARD
================================ */
function SummaryCard({ label, value, color }) {
  return (
    <div className={`p-4 rounded border ${color}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
