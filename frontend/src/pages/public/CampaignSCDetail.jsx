import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicSCCampaignDetail } from "../../api/public.api";
import OnchainDonateBox from "../../components/OnchainDonateBox";

export default function CampaignSCDetail() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchPublicSCCampaignDetail(campaignId);
        setCampaign(res.data);
      } catch (err) {
        console.error("Failed fetch SC campaign detail", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [campaignId]);

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Memuat campaign onchain...</p>;
  }

  if (!campaign) {
    return <p className="p-4 text-sm text-gray-500">Campaign tidak ditemukan.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold">
          Campaign Onchain #{campaign.campaignId}
        </h1>

        <p className="text-sm text-gray-600 mt-1">
          Creator: {short(campaign.creator)}
        </p>

        <p className="text-sm text-gray-600">
          Deadline:{" "}
          {new Date(campaign.deadline * 1000).toLocaleDateString()}
        </p>
      </div>

      {/* ===== BALANCE ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Stat label="USDT" value={campaign.balances?.USDT} />
        <Stat label="USDC" value={campaign.balances?.USDC} />
      </div>

      {/* ===== DONATE ===== */}
      <OnchainDonateBox
        onchainCampaignId={Number(campaign.campaignId)}
        campaignType="SC-ONLY"
      />
    </div>
  );
}

/* ================== */
/* HELPER COMPONENTS */
/* ================== */

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">
        {value ? Number(value).toLocaleString() : "0"}
      </p>
    </div>
  );
}

function short(addr = "") {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
