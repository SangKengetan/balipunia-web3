import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicCampaignDetail } from "../../api/public.api";
import { Loader2 } from "lucide-react";
import StandardWithdrawRequestForm from "./StandardWithdrawRequestForm";
import UnifiedWithdrawRequestForm from "./UnifiedWithdrawRequestForm";

export default function WithdrawRequestForm() {
  const { campaignId } = useParams();

  const [onchain, setOnchain] = useState({ balances: { USDT: "0", USDC: "0" } });
  const [offchain, setOffchain] = useState({ total: "0", txCount: 0 });
  const [campaign, setCampaign] = useState(null);
  
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        const res = await fetchPublicCampaignDetail(campaignId);
        const data = res?.data || res;

        if (data.campaign) setCampaign(data.campaign);
        if (data.onchain) setOnchain(data.onchain);
        if (data.offchain) setOffchain(data.offchain);

      } catch (err) {
        console.error("Gagal ambil data:", err);
        setError("Gagal memuat data kegiatan.");
      } finally {
        setIsFetching(false);
      }
    };

    if (campaignId) fetchData();
  }, [campaignId]);

  if (isFetching) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center">Kegiatan tidak ditemukan.</div>;
  }

  // Branching based on fund_mechanism
  if (campaign.fund_mechanism === "PASCA_KEGIATAN") {
    return (
      <UnifiedWithdrawRequestForm 
        campaignId={campaignId}
        campaign={campaign}
        onchain={onchain}
        offchain={offchain}
      />
    );
  }

  return (
    <StandardWithdrawRequestForm 
      campaignId={campaignId}
      campaign={campaign}
      onchain={onchain}
      offchain={offchain}
    />
  );
}