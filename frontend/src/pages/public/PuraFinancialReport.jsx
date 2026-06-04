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
              <FinancialReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinancialReportCard({ report: r }) {
    let mediaFiles = [];
    try {
        if (r.media_files) {
            mediaFiles = typeof r.media_files === 'string' ? JSON.parse(r.media_files) : r.media_files;
        }
    } catch (e) {
        console.error("Failed to parse media_files", e);
    }

    const hasMedia = mediaFiles && mediaFiles.length > 0;
    const initialCid = hasMedia ? mediaFiles[0].cid : r.ipfs_cid;
    const [activeCid, setActiveCid] = useState(initialCid);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
            
            {/* Header Laporan */}
            <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                    <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {r.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Dipublikasikan: <span className="font-medium text-gray-700">{new Date(r.created_at).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Konten Laporan & Preview PDF */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bagian Kiri: Ringkasan Dana & Tombol */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        <CurrencyStat label="Total Pemasukan" value={r.total_income} type="income" />
                        <CurrencyStat label="Total Pengeluaran" value={r.total_expense} type="expense" />
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Dokumen & Rekam Jejak</h4>
                        
                        {hasMedia ? (
                            <div className="space-y-2">
                                {mediaFiles.map((file, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveCid(file.cid)}
                                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors group ${activeCid === file.cid ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'}`}
                                    >
                                        <div className={`p-2 rounded-lg transition-colors ${activeCid === file.cid ? 'bg-amber-200/50 text-amber-700' : 'bg-gray-100 text-gray-500 group-hover:text-amber-600 group-hover:bg-amber-100/50'}`}>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={file.file_name || `Dokumen Laporan ${idx+1}`}>
                                                {file.file_name || `Dokumen Laporan ${idx+1}`}
                                            </p>
                                            <p className="text-xs text-gray-500">{activeCid === file.cid ? 'Sedang dilihat' : 'Klik untuk melihat'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : r.ipfs_cid ? (
                            <a href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors group">
                                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-amber-200/50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Buka Dokumen Laporan</p>
                                    <p className="text-xs text-gray-500">Tersimpan secara permanen</p>
                                </div>
                            </a>
                        ) : null}

                        {r.anchor_tx_hash && (
                            <a href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group mt-2">
                                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-green-200/50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500 group-hover:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Catatan Transaksi</p>
                                    <p className="text-xs text-gray-500">{r.anchor_tx_hash.slice(0, 8)}...{r.anchor_tx_hash.slice(-6)}</p>
                                </div>
                            </a>
                        )}
                    </div>
                </div>

                {/* Bagian Kanan: Preview PDF */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden h-[500px] lg:h-auto min-h-[500px] flex flex-col shadow-inner">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Preview Dokumen
                        </span>
                        {activeCid && (
                            <a href={`https://gateway.pinata.cloud/ipfs/${activeCid}`} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors">
                                Buka di Tab Baru <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        )}
                    </div>
                    {activeCid ? (
                        <iframe 
                            src={`https://gateway.pinata.cloud/ipfs/${activeCid}#toolbar=0&navpanes=0&scrollbar=0`} 
                            title={`Preview Document`}
                            className="w-full h-full flex-1"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-sm font-medium">Preview dokumen tidak tersedia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}