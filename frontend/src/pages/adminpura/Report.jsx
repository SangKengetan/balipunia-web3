import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "../../api/adminPura.api";
// Pastikan path import ini sesuai dengan struktur projectmu
import useToast from "../../hooks/useToast"; 
import { 
  Plus, 
  FileText, 
  ExternalLink, 
  Search, 
  Link as LinkIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Calendar
} from "lucide-react";

export default function FinanceReportList() {
  const { error } = useToast(); // Asumsi hook ini ada
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetchReports();
      // Handle response structure variations
      const data = res.data?.data || res.data || [];
      setReports(data);
    } catch (e) {
      console.error(e);
      // Jika useToast belum ready, fallback ke alert console
      if (error) error(e.message || "Gagal memuat laporan keuangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-8 font-sans pb-10">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
             Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
             Transparansi dana punia yang tercatat abadi di Blockchain.
          </p>
        </div>

        {/* Tombol Create New Report */}
        <button
          onClick={() => navigate("/admin/pura/financereports/create")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all transform active:scale-95"
        >
          <Plus size={18} />
          Buat Laporan Baru
        </button>
      </div>

      {/* 2. Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-2" />
            <p>Memuat data on-chain...</p>
          </div>
        )}
        
        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-gray-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
               <Search size={32} />
            </div>
            <h3 className="font-bold text-gray-700 text-lg">Belum ada laporan</h3>
            <p className="text-sm mt-1 max-w-xs text-center text-gray-400">
              Laporan keuangan bulanan atau kegiatan pura Anda akan muncul di sini.
            </p>
          </div>
        )}

        {/* Table Data */}
        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Tanggal & Judul</th>
                  <th className="px-6 py-4">Pemasukan</th>
                  <th className="px-6 py-4">Pengeluaran</th>
                  <th className="px-6 py-4">Bukti File</th>
                  <th className="px-6 py-4 text-right">Blockchain Anchor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition-colors group">
                    
                    {/* Kolom 1: Info Laporan */}
                    <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-gray-100 rounded-lg text-gray-500">
                                <FileText size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-base line-clamp-1 mb-1">
                                    {r.title}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                    <Calendar size={12} />
                                    {new Date(r.anchored_at || r.created_at).toLocaleDateString('id-ID', { 
                                      day: 'numeric', month: 'long', year: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>
                    </td>

                    {/* Kolom 2: Income */}
                    <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <ArrowDownRight size={14} className="text-emerald-600" />
                          {formatRupiah(r.total_income)}
                        </span>
                    </td>

                    {/* Kolom 3: Expense */}
                    <td className="px-6 py-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          <ArrowUpRight size={14} className="text-rose-600" />
                          {formatRupiah(r.total_expense)}
                        </span>
                    </td>

                    {/* Kolom 4: IPFS Link */}
                    <td className="px-6 py-4 align-middle">
                      {r.ipfs_cid ? (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
                          >
                            <LinkIcon size={14} />
                            <span>Lihat Bukti</span>
                          </a>
                      ) : (
                          <span className="text-gray-300 text-xs italic">Tanpa lampiran</span>
                      )}
                    </td>

                    {/* Kolom 5: Blockchain Proof */}
                    <td className="px-6 py-4 text-right align-middle">
                        {r.anchor_tx_hash ? (
                            <a 
                                href={`https://testnet.bscscan.com/tx/${r.anchor_tx_hash}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 justify-end group/link bg-gray-50 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-amber-200 transition-colors"
                            >
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">BSC Testnet</div>
                                    <div className="font-mono text-xs text-gray-700 font-medium group-hover/link:text-amber-700">
                                        {truncateHash(r.anchor_tx_hash)}
                                    </div>
                                </div>
                                <ExternalLink size={14} className="text-gray-400 group-hover/link:text-amber-500" />
                            </a>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse">
                                Menunggu Konfirmasi
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

// --- Helper Functions ---

function formatRupiah(amount) {
    // Handle null/undefined safely
    const val = amount || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);
}

function truncateHash(hash) {
    if (!hash) return "-";
    // Format standar Web3: 0x1234...5678
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}