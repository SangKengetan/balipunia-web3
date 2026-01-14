import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCampaigns } from "../../api/adminPura.api";

export default function WithdrawCampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await getMyCampaigns();

      // FILTER SESUAI KEBUTUHAN WITHDRAW
      const eligibleCampaigns = res.data.filter(
        (c) =>
          c.is_onchain_enabled === true &&
          c.status !== "REQUEST_WD"
      );

      setCampaigns(eligibleCampaigns);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat campaign");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading campaign...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Pilih Campaign untuk Withdraw
      </h1>

      {campaigns.length === 0 ? (
        <div className="text-gray-500">
          Tidak ada campaign yang dapat direquest withdraw.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <h2 className="font-medium text-lg">
                {campaign.title}
              </h2>

              <p className="text-sm text-gray-600 mt-1">
                Status: {campaign.status}
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/admin/pura/withdraw/request/${campaign.id}`
                  )
                }
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Request Withdraw
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
