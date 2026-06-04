import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReports, fetchAllCampaignReports } from "../../api/adminPura.api";
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
  Calendar,
  Layers,
  FileSpreadsheet
} from "lucide-react";

export default function FinanceReportList() {
  const { error } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("mandiri"); // "mandiri" | "kegiatan"

  const [financeReports, setFinanceReports] = useState([]);
  const [campaignReports, setCampaignReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resFinance, resCampaign] = await Promise.all([
        fetchReports(),
        fetchAllCampaignReports()
      ]);

      const dataFinance = resFinance.data?.data || resFinance.data || [];
      const dataCampaign = resCampaign.data?.data || resCampaign.data || [];

      setFinanceReports(dataFinance);
      setCampaignReports(dataCampaign);
    } catch (e) {
      console.error(e);
      if (error) error(e.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeReports = activeTab === "mandiri" ? financeReports : campaignReports;

  return (
    <div className="space-y-8 font-sans pb-10">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Laporan Pura
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pusat transparansi dana punia dan dokumentasi kegiatan.
          </p>
        </div>

        {/* Tombol Create New Report */}
        <button
          onClick={() => navigate(activeTab === "mandiri" ? "/admin/pura/financereports/create" : "/admin/pura/campaigns")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 hover:shadow-amber-300 transition-all transform active:scale-95"
        >
          <Plus size={18} />
          {activeTab === "mandiri" ? "Buat Laporan Mandiri" : "Buat Laporan Kegiatan"}
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("mandiri")}
          className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "mandiri"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
        >
          <FileSpreadsheet size={18} />
          Laporan Keuangan / Mandiri
        </button>
        <button
          onClick={() => setActiveTab("kegiatan")}
          className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "kegiatan"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
            }`}
        >
          <Layers size={18} />
          Laporan Kegiatan (Campaigns)
        </button>
      </div>

      {/* 3. Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-2" />
            <p>Memuat data laporan...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && activeReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-gray-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Search size={32} />
            </div>
            <h3 className="font-bold text-gray-700 text-lg">Belum ada laporan</h3>
            <p className="text-sm mt-1 max-w-xs text-center text-gray-400">
              {activeTab === "mandiri"
                ? "Laporan keuangan bulanan atau umum pura akan muncul di sini."
                : "Dokumentasi dan rincian dana kegiatan (campaign) akan muncul di sini."}
            </p>
          </div>
        )}

        {/* === MANDIRI TAB: Table Data === */}
        {!loading && activeTab === "mandiri" && financeReports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Tanggal & Judul</th>
                  <th className="px-6 py-4">Total Pemasukan</th>
                  <th className="px-6 py-4">Total Pengeluaran</th>
                  <th className="px-6 py-4">Bukti File</th>
                  <th className="px-6 py-4 text-right">Blockchain Anchor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {financeReports.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition-colors group">
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

                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <ArrowDownRight size={14} className="text-emerald-600" />
                        {formatRupiah(r.total_income)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <ArrowUpRight size={14} className="text-rose-600" />
                        {formatRupiah(r.total_expense)}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      {(() => {
                        let parsedFiles = [];
                        if (r.media_files) {
                          parsedFiles = typeof r.media_files === 'string' ? JSON.parse(r.media_files) : r.media_files;
                        }

                        if (parsedFiles.length > 0) {
                          return (
                            <div className="flex flex-col gap-1.5">
                              {parsedFiles.map((m, idx) => (
                                <a
                                  key={idx}
                                  href={`https://gateway.pinata.cloud/ipfs/${m.cid}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline transition-all truncate max-w-[200px]"
                                  title={m.file_name}
                                >
                                  <LinkIcon size={12} className="shrink-0" />
                                  <span className="truncate">{m.file_name || `File ${idx + 1}`}</span>
                                </a>
                              ))}
                              {r.ipfs_cid && (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 mt-1 text-gray-400 hover:text-gray-600 text-[10px] uppercase tracking-wider font-bold"
                                  title="Lihat Metadata (Smart Contract Anchor)"
                                >
                                  JSON Metadata
                                </a>
                              )}
                            </div>
                          );
                        } else if (r.ipfs_cid) {
                          return (
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
                            >
                              <LinkIcon size={14} />
                              <span>Lihat File</span>
                            </a>
                          );
                        } else {
                          return <span className="text-gray-300 text-xs italic">Tanpa lampiran</span>;
                        }
                      })()}
                    </td>

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

        {/* === KEGIATAN TAB: Social Media Style Feed === */}
        {!loading && activeTab === "kegiatan" && campaignReports.length > 0 && (
          <div className="p-6 space-y-6">
            {campaignReports.map((r) => {
              const mediaFiles = (typeof r.media_files === 'string' ? JSON.parse(r.media_files) : r.media_files) || [];
              const gateway = "https://gateway.pinata.cloud";

              return (
                <div key={r.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                  {/* Post Header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-300 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {(r.campaign_title || "?")[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm line-clamp-1">
                            {r.campaign_title}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={11} />
                            {new Date(r.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      {/* IPFS Metadata Link */}
                      {r.metadata_cid && (
                        <a
                          href={`${gateway}/ipfs/${r.metadata_cid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-md font-mono hover:bg-amber-50 hover:text-amber-700 transition-colors border border-gray-200 hover:border-amber-200"
                          title="Lihat JSON Metadata di IPFS"
                        >
                          IPFS: {truncateHash(r.metadata_cid)}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Post Description */}
                  {r.description && (
                    <div className="px-5 pb-3">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {r.description}
                      </p>
                    </div>
                  )}

                  {/* Photo Grid */}
                  {mediaFiles.length > 0 && (
                    <div className={`grid gap-0.5 ${mediaFiles.length === 1 ? 'grid-cols-1'
                        : mediaFiles.length === 2 ? 'grid-cols-2'
                          : mediaFiles.length === 3 ? 'grid-cols-2'
                            : 'grid-cols-2'
                      }`}>
                      {mediaFiles.slice(0, 4).map((m, idx) => {
                        const isImage = m.mime_type?.startsWith("image/");
                        const url = `${gateway}/ipfs/${m.cid}`;

                        // Special layout for 3 images: first one spans full width
                        const spanFull = mediaFiles.length === 3 && idx === 0;

                        return (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className={`block relative overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity ${spanFull ? 'col-span-2' : ''
                              }`}
                          >
                            {isImage ? (
                              <img
                                src={url}
                                alt={m.file_name}
                                className="w-full h-48 object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={32} />
                                <span className="text-xs mt-1">{m.file_name}</span>
                              </div>
                            )}

                            {/* Overlay for remaining count */}
                            {idx === 3 && mediaFiles.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">+{mediaFiles.length - 4}</span>
                              </div>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Post Footer: Financial Summary */}
                  <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <ArrowDownRight size={14} className="text-emerald-600" />
                        {formatRupiah(r.total_income)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <ArrowUpRight size={14} className="text-rose-600" />
                        {formatRupiah(r.total_expense)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper Functions ---

function formatRupiah(amount) {
  const val = amount || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val);
}

function truncateHash(hash) {
  if (!hash) return "-";
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}