import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFinancialReportsByPura } from "../../api/public.api";

export default function PuraFinancialReports() {
  const { puraId } = useParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchFinancialReportsByPura(puraId);
        setReports(res.data || []);
      } catch (err) {
        console.error("Failed fetch financial reports", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [puraId]);

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Memuat laporan keuangan...</p>;
  }

  if (!reports.length) {
    return (
      <p className="p-4 text-sm text-gray-500">
        Belum ada laporan keuangan yang dipublikasikan.
      </p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Laporan Keuangan Pura</h1>

      {reports.map((r) => (
        <div
          key={r.id}
          className="border rounded-xl p-4 bg-white space-y-2"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-xs text-gray-500">
                Dibuat: {new Date(r.created_at).toLocaleString()}
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
              Teraudit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Stat label="Total Pemasukan" value={r.total_income} positive />
            <Stat label="Total Pengeluaran" value={r.total_expense} />
          </div>

          <div className="flex flex-wrap gap-3 text-sm mt-3">
            {r.ipfs_cid && (
              <a
                href={`https://ipfs.io/ipfs/${r.ipfs_cid}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                📄 Lihat Laporan (IPFS)
              </a>
            )}

            {r.anchor_tx_hash && (
              <a
                href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-green-600 hover:underline"
              >
                🔗 Anchor On-chain
              </a>
            )}
          </div>

          {r.anchored_at && (
            <p className="text-xs text-gray-500 mt-1">
              Di-anchor on-chain pada{" "}
              {new Date(r.anchored_at).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================== */
/* HELPER COMPONENTS */
/* ================== */

function Stat({ label, value, positive }) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-lg font-semibold ${
          positive ? "text-green-600" : "text-red-600"
        }`}
      >
        Rp{Number(value).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
