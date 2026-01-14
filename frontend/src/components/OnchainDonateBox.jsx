import { useState } from "react";
import {
  donateOnChain,
  CAMPAIGN_TYPE,
} from "../services/blockchain/onchainDonation";


export default function OnchainDonateBox({
  onchainCampaignId,
  campaignType, // "HYBRID" | "SC_ONLY"
}) {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [loading, setLoading] = useState(false);
  
  
  console.log("Donate params:", {
  campaignId: onchainCampaignId,
  campaignType: CAMPAIGN_TYPE[campaignType],
  token,
  amount});


  async function handleDonate() {
    try {
      setLoading(true);
      const campaignTypeValue = CAMPAIGN_TYPE[campaignType];

      // 🔒 GUARD WAJIB
      if (campaignTypeValue === undefined) {
        throw new Error(`Campaign type tidak valid: ${campaignType}`);
      }

      const txHash = await donateOnChain({
        campaignId: Number(onchainCampaignId), // ⬅️ PASTIKAN INI ADA
        campaignType: 1, // ⬅️ mapping enum
        tokenKey: token,
        amount,
      });

      alert("Donasi berhasil!\nTx Hash:\n" + txHash);
      setAmount("");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Donasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-slate-50 space-y-3">
      <div className="text-sm font-semibold">
        Donasi Crypto (On-Chain)
      </div>

      <div className="flex gap-2">
        <select
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="USDT">USDT</option>
          <option value="USDC">USDC</option>
        </select>

        <input
          type="number"
          min="0"
          step="any"
          placeholder="Jumlah"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
      </div>

      <button
        onClick={handleDonate}
        disabled={loading || !amount}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Donasi Sekarang"}
      </button>

      <p className="text-xs text-gray-500">
        Donasi dilakukan melalui smart contract dan tercatat on-chain.
      </p>
    </div>
  );
}
