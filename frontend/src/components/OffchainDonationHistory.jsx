import { useEffect, useState } from "react";
import { fetchPublicCampaignDetail } from "../api/public.api";

export default function OffchainSummary({ campaignId }) {
  const [donations, setDonations] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [hasDeadline, setHasDeadline] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  const totalPages = Math.ceil(donations.length / itemsPerPage);
  const displayedDonations = donations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSeeMore = () => {
    setItemsPerPage(15);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* TOTALS */}
      <div className="grid grid-cols-1 gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rupiah (Tunai / Transfer)</p>
            <div className="text-sm font-black px-2 py-1 rounded border text-blue-700 bg-blue-50 border-blue-200">
              IDR
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">Total Terkumpul</p>
              <p className="font-extrabold text-2xl text-slate-900">Rp{totalCollected.toLocaleString("id-ID")}</p>
            </div>
            {!hasDeadline && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 mb-1">Dana Belum Ditarik</p>
                <p className="font-bold text-[#FBBF24] text-lg">Rp{currentBalance.toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Riwayat Transaksi Tunai</h3>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-slate-50/50">
          {donations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-400">Belum ada transaksi tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex flex-col">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap">Donatur</th>
                    <th className="px-5 py-3 whitespace-nowrap">Jumlah (IDR)</th>
                    <th className="px-5 py-3 whitespace-nowrap">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {displayedDonations.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-white transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-800 text-sm">
                        {d.donor_name || "Anonim"}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                        Rp{Number(d.gross_amount).toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {d.updated_at
                          ? new Date(d.updated_at).toLocaleString("id-ID", {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {donations.length > 5 && itemsPerPage === 5 && (
                <div className="flex justify-center p-3 bg-white border-t border-gray-100">
                  <button onClick={handleSeeMore} className="flex flex-col items-center justify-center text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors w-full py-1">
                    <span>Lihat Lainnya</span>
                    <svg className="w-4 h-4 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              )}
              {itemsPerPage === 15 && totalPages > 1 && (
                <div className="flex justify-between items-center p-4 bg-white border-t border-gray-100">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs font-semibold text-slate-500">Halaman {currentPage} dari {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}