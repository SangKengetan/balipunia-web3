import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import navigasi
import { fetchReports } from "../../api/adminPura.api";
import useToast from "../../hooks/useToast";

// --- Icons ---
const PlusIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
const DocumentIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const ExternalLinkIcon = () => (<svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const SearchIcon = () => (<svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const CubeIcon = () => (<svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>);

export default function FinanceReportList() {
  const { error } = useToast();
  const navigate = useNavigate(); // Hook untuk navigasi

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
  try {
    setLoading(true);
    const res = await fetchReports();
    setReports(res.data.data); // ✅ FIX
  } catch (e) {
    error(e.message || "Gagal memuat laporan keuangan");
  } finally {
    setLoading(false);
  }
  };


  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-8 fade-in-enter">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
             Laporan Keuangan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar transparansi dana punia yang tercatat di Blockchain.
          </p>
        </div>

        {/* Tombol Create New Report */}
        <button
          onClick={() => navigate("/admin/pura/financereports/create")} // Sesuaikan route kamu
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all transform active:scale-95"
        >
          <PlusIcon />
          Buat Laporan Baru
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {loading && <div className="p-12 text-center text-slate-400 animate-pulse">Memuat data laporan...</div>}
        
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <SearchIcon />
            </div>
            <p className="font-medium text-slate-600">Belum ada laporan keuangan</p>
            <p className="text-xs mt-1">Klik tombol di atas untuk membuat laporan pertama.</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tanggal & Judul</th>
                  <th className="px-6 py-4">Pemasukan</th>
                  <th className="px-6 py-4">Pengeluaran</th>
                  <th className="px-6 py-4">Bukti IPFS</th>
                  <th className="px-6 py-4 text-right">Blockchain Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Kolom Tanggal & Judul */}
                    <td className="px-6 py-4">
                        <div className="text-xs text-slate-400 mb-1 font-mono">
                            {new Date(r.anchored_at || r.created_at).toLocaleDateString('id-ID', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                        </div>
                        <div className="font-bold text-slate-800 text-base line-clamp-1">{r.title}</div>
                    </td>

                    {/* Kolom Income */}
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                         + {formatRupiah(r.total_income)}
                       </span>
                    </td>

                    {/* Kolom Expense */}
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                         - {formatRupiah(r.total_expense)}
                       </span>
                    </td>

                    {/* Kolom IPFS */}
                    <td className="px-6 py-4">
                      {r.ipfs_cid ? (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-medium border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                          >
                            <DocumentIcon />
                            <span>Lihat File</span>
                          </a>
                      ) : (
                          <span className="text-slate-300 text-xs italic">Tidak ada file</span>
                      )}
                    </td>

                    {/* Kolom Blockchain Proof */}
                    <td className="px-6 py-4 text-right">
                        {r.anchor_tx_hash ? (
                            <a 
                                href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 justify-end group/link bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
                            >
                                <CubeIcon />
                                <span className="font-mono text-xs text-indigo-700 font-medium">
                                    {truncateHash(r.anchor_tx_hash)}
                                </span>
                                <ExternalLinkIcon />
                            </a>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                Pending
                            </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helpers ---

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function truncateHash(hash) {
    if (!hash) return "-";
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}