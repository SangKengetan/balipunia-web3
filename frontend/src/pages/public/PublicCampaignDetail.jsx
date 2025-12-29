import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicCampaignDetail } from "../../services/campaignApi";

export default function PublicCampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicCampaignDetail(id);
        setCampaign(res.data);
      } catch {
        alert("Campaign tidak ditemukan");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Memuat campaign...</p>;
  if (!campaign) return <p>Campaign tidak tersedia</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            {campaign.campaign_title}
          </h1>
          <p className="text-gray-600 mt-1">
            {campaign.description}
          </p>
        </div>

        <div className="text-sm text-gray-700">
          <div>
            <strong>Pura:</strong> {campaign.nama_pura}
          </div>

          {campaign.alamat_pura && (
            <div>
              <strong>Alamat:</strong> {campaign.alamat_pura}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Tujuan Dana: {campaign.purpose} <br />
          Deadline:{" "}
          {new Date(campaign.deadline).toLocaleDateString()}
        </div>

        {/* DONATION ACTION */}
        <div className="pt-4 border-t flex gap-3">
          {campaign.is_onchain_enabled && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              Donasi Crypto (On-Chain)
            </button>
          )}

          {campaign.is_offchain_enabled && (
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              Donasi Non-Crypto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
