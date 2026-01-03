import { useEffect, useState } from "react";
import { getCampaignDonations } from "../services/campaignAPI.js";

function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function DonationHistory({ campaignId }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCampaignDonations(campaignId);
        setDonations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  if (loading) return <p className="text-sm">Memuat donasi...</p>;
  if (!donations.length)
    return <p className="text-sm text-gray-500">Belum ada donasi</p>;

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Riwayat Donasi</h3>

      <div className="space-y-2">
        {donations.map((d, i) => (
          <div
            key={i}
            className="flex justify-between text-sm border-b pb-1"
          >
            <div>
              <div className="font-mono">
                {shortAddress(d.donor_address)}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(d.created_at).toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div>
                {(Number(d.amount) / 1e18).toLocaleString()}{" "}
                {d.token_address ===
                "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
                  ? "USDT"
                  : "USDC"}
              </div>
              <a
                href={`https://testnet.bscscan.com/tx/${d.tx_hash}`}
                target="_blank"
                className="text-xs text-blue-600 underline"
              >
                Lihat Tx
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
