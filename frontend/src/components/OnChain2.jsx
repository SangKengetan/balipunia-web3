import { useState } from "react";
import {
  donateOnChain,
  CAMPAIGN_TYPE,
} from "../services/blockchain/onchainDonation";

export default function OnchainDonateBox({
  onchainCampaignId,
  campaignType, // "HYBRID" | "SC-ONLY"
}) {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    try {
      setLoading(true);

      const campaignTypeValue = CAMPAIGN_TYPE[campaignType];

      // 🔒 GUARD WAJIB
      if (campaignTypeValue === undefined) {
        throw new Error(`Campaign type tidak valid: ${campaignType}`);
      }

      if (!onchainCampaignId) {
        throw new Error("Campaign ID on-chain tidak tersedia");
      }

      if (!amount || Number(amount) <= 0) {
        throw new Error("Jumlah donasi harus lebih dari 0");
      }

      const txHash = await donateOnChain({
        campaignId: BigInt(onchainCampaignId), // ✅ BIGINT
        campaignType: campaignTypeValue,       // ✅ ENUM BENAR
        tokenKey: token,
        amount,
      });

      alert("Donasi berhasil!\nTx Hash:\n" + txHash);
      setAmount("");
    } catch (err) {
      console.error("DONATE ERROR:", err);
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
