import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCampaignDetailFull } from "../../api/adminPura.api";

export default function CampaignDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    getCampaignDetailFull(id).then(res => setData(res.data));
  }, [id]);

  if (!data) return <p>Loading...</p>;

  const { campaign, onchain_balance, donation_history } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{campaign.title}</h1>
      <p>{campaign.description}</p>

      {onchain_balance && (
        <div>
          <h2 className="font-semibold">Saldo On-chain</h2>
          <p>USDT: {onchain_balance.USDT}</p>
          <p>USDC: {onchain_balance.USDC}</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold">Riwayat Donasi</h2>
        {donation_history.map((d, i) => (
          <div key={i} className="text-sm border-b py-1">
            {d.amount} {d.token} dari {d.donor}
          </div>
        ))}
      </div>
    </div>
  );
}
