import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Tambah useNavigate
import { fetchFinancialReportsByPura } from "../../api/public.api";

// Helper Component untuk Formatter Rupiah
const CurrencyStat = ({ label, value, type }) => {
  const isIncome = type === "income";
  const colorClass = isIncome ? "text-emerald-600" : "text-rose-600";
  const bgClass = isIncome ? "bg-emerald-50" : "bg-rose-50";
  const icon = isIncome ? (
    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ) : (
    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );

  return (
    <div className={`flex flex-col p-3 rounded-lg border border-gray-100 ${bgClass} bg-opacity-50`}>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</span>
      <div className={`flex items-center text-lg font-bold ${colorClass}`}>
        {icon}
        Rp {Number(value).toLocaleString("id-ID")}
      </div>
    </div>
  );
};

export default function PuraFinancialReports() {
  const { puraId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchFinancialReportsByPura(puraId);
        setReports(res.data || []);
      } catch (err) {
        console.error("Failed fetch financial reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [puraId]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-yellow-600 flex items-center gap-1 mb-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Detail Pura
            </button>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Transparansi Keuangan
            </h1>
            <p className="text-gray-500 mt-1">
              Daftar laporan penggunaan dana punia yang tercatat secara on-chain.
            </p>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-12 bg-gray-100 rounded"></div>
                   <div className="h-12 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !reports.length ? (
          /* EMPTY STATE */
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Belum Ada Laporan</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              Pengelola pura belum mempublikasikan laporan keuangan resmi.
            </p>
          </div>
        ) : (
          /* LIST REPORTS */
          <div className="space-y-6">
            {reports.map((r) => (
              <div
                key={r.id}
                className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Card Header: Title & Meta */}
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex gap-4">
                     {/* Icon Dokumen */}
                     <div className="hidden sm:flex h-12 w-12 bg-yellow-50 rounded-lg items-center justify-center flex-shrink-0 text-yellow-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                             {r.title}
                           </h3>
                           {/* Badge Verified */}
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              Verified
                           </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Dipublikasikan: <span className="font-medium text-gray-700">{new Date(r.created_at).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                     </div>
                  </div>
                </div>

                {/* Card Body: Financial Stats */}
                <div className="p-6 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <CurrencyStat label="Total Pemasukan" value={r.total_income} type="income" />
                   <CurrencyStat label="Total Pengeluaran" value={r.total_expense} type="expense" />
                </div>

                {/* Card Footer: Blockchain Proofs (Web3 Style) */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-wrap gap-3 items-center text-sm">
                   <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Blockchain Proofs:</span>
                   
                   {r.ipfs_cid && (
                      <a
                        href={`https://ipfs.io/ipfs/${r.ipfs_cid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm group/link"
                      >
                         <svg className="w-4 h-4 text-gray-400 group-hover/link:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span className="font-mono text-xs">IPFS Document</span>
                      </a>
                   )}

                   {r.anchor_tx_hash && (
                      <a
                        href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-green-600 hover:border-green-200 transition-all shadow-sm group/link"
                      >
                         <svg className="w-4 h-4 text-gray-400 group-hover/link:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                         </svg>
                         <span className="font-mono text-xs">
                            Tx: {r.anchor_tx_hash.slice(0, 6)}...{r.anchor_tx_hash.slice(-4)}
                         </span>
                      </a>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}