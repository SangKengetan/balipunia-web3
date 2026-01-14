import { useEffect, useState } from "react";
import { fetchPublicCampaignDetail } from "../api/public.api";

export default function OffchainSummary({ campaignId }) {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchPublicCampaignDetail(campaignId);
        
        // 1. Ambil bagian 'offchain' dari response data
        // Menggunakan optional chaining (?.) untuk keamanan jika data null
        const offchainData = res.data?.offchain || {};

        // 2. Set list transaksi dari offchain.transactions
        const transactions = offchainData.transactions || [];
        setDonations(transactions);

        // 3. Set total langsung dari offchain.total (konversi ke Number)
        // Jika API sudah menyediakan total, lebih baik pakai itu daripada reduce manual
        setTotal(Number(offchainData.total) || 0);

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
      {/* TOTAL */}
      <div className="rounded-xl border p-4">
        <p className="text-sm text-gray-500">
          Total Donasi Non-Crypto
        </p>
        <p className="text-2xl font-semibold">
          Rp{total.toLocaleString("id-ID")}
        </p>
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