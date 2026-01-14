// src/components/CampaignCardDB.jsx
import { useNavigate } from "react-router-dom";

export default function CampaignCardDB({ campaign }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/campaign/${campaign.id}`)}
      className="cursor-pointer rounded-xl border p-4 hover:shadow transition"
    >
      <h3 className="font-semibold">{campaign.title}</h3>
      <p className="text-xs text-gray-500 mt-1">
        Tipe: {campaign.campaign_type}
      </p>
    </div>
  );
}
