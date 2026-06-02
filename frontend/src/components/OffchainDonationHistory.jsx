import { useEffect, useState } from "react";
import { fetchPublicCampaignDetail } from "../api/public.api";

export default function OffchainSummary({ campaignId }) {
  const [donations, setDonations] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [hasDeadline, setHasDeadline] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchPublicCampaignDetail(campaignId);
        
        const campaignData = res.data?.campaign || {};
        setHasDeadline(!!campaignData.deadline);

        const offchainData = res.data?.offchain || {};

        const transactions = offchainData.transactions || [];
        setDonations(transactions);

        setTotalCollected(Number(offchainData.total_collected) || 0);
        setCurrentBalance(Number(offchainData.current_balance) || 0);

      } catch (err) {
        console.error("Failed fetch offchain donations", err);
      }
    }

    if (campaignId) {
        fetchData();
    }
  }, [campaignId]);

  return (
    <div className="space-y-4">
      {/* TOTALS */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
           <p className="text-sm font-bold text-blue-700 opacity-80 tracking-wide uppercase">Donasi Tunai</p>
           <div className="text-xl filter grayscale hover:grayscale-0 transition-all cursor-default">🏦</div>
        </div>
        <div className="space-y-2 text-blue-900">
          <div className="flex justify-between items-center text-sm">
            <span className="opacity-70 font-medium">Total Terkumpul:</span>
            <span className="font-bold">Rp{totalCollected.toLocaleString("id-ID")}</span>
          </div>
          {!hasDeadline && (
            <div className="flex justify-between items-center text-sm border-t border-blue-200 pt-2">
              <span className="opacity-70 font-medium">Dana Belum Ditarik:</span>
              <span className="font-bold">Rp{currentBalance.toLocaleString("id-ID")}</span>
            </div>
          )}
        </div>
      </div>

      {/* HISTORY */}
      {donations.length === 0 ? (
        <p className="text-sm text-gray-500">
          Belum ada donasi non-crypto.
        </p>
      ) : (
        <div className="space-y-2">
          <h4 className="font-semibold">
            Riwayat Donasi Non-Crypto
          </h4>

          {donations.map((d, i) => (
            <div
              key={i}
              className="flex justify-between text-sm border-b pb-1"
            >
              <div>
                <div className="font-medium">
                  {d.donor_name || "Anonim"}
                </div>
                <div className="text-xs text-gray-400">
                  {/* Perbaikan: Menggunakan updated_at sesuai JSON, bukan created_at */}
                  {d.updated_at 
                    ? new Date(d.updated_at).toLocaleString("id-ID") 
                    : "-"}
                </div>
              </div>

              <div className="font-semibold">
                Rp{Number(d.gross_amount).toLocaleString("id-ID")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}