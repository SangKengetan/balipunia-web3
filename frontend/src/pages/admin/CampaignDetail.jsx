import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardShell from "../../components/DashboardShell";
import { getCampaignById } from "../../services/campaignApi";
import { showError } from "../../utils/notification";

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCampaignById(id);
        setCampaign(res.data);
      } catch (err) {
        console.error(err);
        showError("Gagal Memuat", "Gagal mengambil detail campaign.", "Silakan muat ulang halaman atau coba beberapa saat lagi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <DashboardShell title="Detail Campaign">
        <p>Memuat data...</p>
      </DashboardShell>
    );
  }

  if (!campaign) {
    return (
      <DashboardShell title="Detail Campaign">
        <p className="text-red-500">Campaign tidak ditemukan</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Detail Campaign">
      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <div>
          <h2 className="text-xl font-semibold">{campaign.title}</h2>
          <p className="text-gray-600 mt-1">{campaign.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tujuan Dana</span>
            <div className="font-medium">{campaign.purpose}</div>
          </div>

          <div>
            <span className="text-gray-500">Status</span>
            <div className="font-medium">{campaign.status}</div>
          </div>

          <div>
            <span className="text-gray-500">Punia On-chain</span>
            <div className="font-medium">
              {campaign.is_onchain_enabled ? "Aktif" : "Nonaktif"}
            </div>
          </div>

          <div>
            <span className="text-gray-500">Punia Off-chain</span>
            <div className="font-medium">
              {campaign.is_offchain_enabled ? "Aktif" : "Nonaktif"}
            </div>
          </div>

          <div>
            <span className="text-gray-500">Dibuat</span>
            <div className="font-medium">
              {new Date(campaign.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4 border-t">
          <Link
            to={`/admin/pura/campaigns/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
          >
            Edit Campaign
          </Link>

          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-600 text-sm rounded cursor-not-allowed"
          >
            Request Penarikan Dana (Coming Soon)
          </button>

          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-600 text-sm rounded cursor-not-allowed"
          >
            Upload Laporan (Coming Soon)
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
