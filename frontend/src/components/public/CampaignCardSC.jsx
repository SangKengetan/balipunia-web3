import { useState } from "react";
import OnchainDonateBox from "../OnChain2";

export default function CampaignCardSC({ campaign }) {
  const [showDonate, setShowDonate] = useState(false);

  return (
    <div className="rounded-xl border p-4 space-y-3 hover:shadow transition">
      
      {/* HEADER */}
      <div>
        <h3 className="font-semibold">{campaign.title}</h3>
        <p className="text-xs text-gray-500">
          Campaign ID: {campaign.id_campaign_onchain}
        </p>
      </div>

      {/* SALDO */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">USDT</p>
          <p className="font-semibold">
            {Number(campaign.balances?.USDT || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-500">USDC</p>
          <p className="font-semibold">
            {Number(campaign.balances?.USDC || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* TOGGLE DONATE */}
      <button
        onClick={() => setShowDonate((v) => !v)}
        className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        {showDonate ? "Tutup Donasi" : "Donasi Onchain"}
      </button>

      {/* DONATE BOX */}
      {showDonate && (
        <OnchainDonateBox
          onchainCampaignId={campaign.id_campaign_onchain}
          campaignType="SC-ONLY"
        />
      )}
    </div>
  );
}
