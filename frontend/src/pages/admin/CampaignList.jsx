import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyCampaigns } from "../../services/campaignApi";
import DashboardShell from "../../components/DashboardShell";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCampaigns();
        setCampaigns(res.data);
      } catch {
        alert("Gagal mengambil campaign");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell title="Kelola Campaign">
      <div className="flex justify-end mb-4">
        <Link
          to="/admin/pura/campaigns/create"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Buat Campaign
        </Link>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-gray-600">
          Belum ada campaign dibuat.
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{c.title}</h2>
                  <p className="text-sm text-gray-600">{c.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Tujuan: {c.purpose}
                  </div>
                </div>
                <Link
                  to={`/admin/pura/campaigns/${c.id}`}
                  className="text-blue-600 text-sm underline"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
