import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicCampaigns } from "../../services/campaignApi";

function truncate(text, max = 120) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function PublicCampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicCampaigns();
        setCampaigns(res.data || []);
      } catch {
        alert("Gagal mengambil campaign");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Memuat campaign...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Daftar Campaign Donasi
      </h1>

      {campaigns.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow text-gray-600">
          Belum ada campaign donasi yang tersedia.
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const deadline = new Date(c.deadline);
            const isExpired = deadline < new Date();

            return (
              <div
                key={c.id}
                className="bg-white p-6 rounded-xl shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {c.campaign_title}
                    </h2>

                    <p className="text-sm text-gray-600 mt-1">
                      {truncate(c.description)}
                    </p>

                    <div className="mt-2 text-sm">
                      <strong>Pura:</strong> {c.nama_pura}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Tujuan: {c.purpose} • Deadline:{" "}
                      {deadline.toLocaleDateString()}
                    </div>
                  </div>

                  {isExpired && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                      Berakhir
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    to={`/campaigns/${c.id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                  >
                    Lihat Detail
                  </Link>

                  {c.is_onchain_enabled && (
                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      Crypto
                    </span>
                  )}

                  {c.is_offchain_enabled && (
                    <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Non-Crypto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
