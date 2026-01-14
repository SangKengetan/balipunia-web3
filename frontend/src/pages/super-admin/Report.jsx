import { useEffect, useState } from "react";
import {
  fetchReports,
  approveReport,
  rejectReport,
} from "../../api/superAdmin.api";
import useToast from "../../hooks/useToast";

// Icons
const DocumentIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const ExternalLinkIcon = () => (<svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const CheckIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
const XIcon = () => (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const SearchIcon = () => (<svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);

const STATUS_TABS = [
  { id: "ALL", label: "Semua" },
  { id: "PENDING", label: "Menunggu" },
  { id: "APPROVED", label: "Disetujui" },
  { id: "REJECTED", label: "Ditolak" }
];

export default function Reports() {
  const { success, error } = useToast();

  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [setErrMsg] = useState("");

  const [selected, setSelected] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetchReports(status);
      setReports(res.data.data);
    } catch (e) {
      setErrMsg(e.message || "Gagal memuat pengajuan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [status]);

  const closeModal = () => {
    setSelected(null);
    setRejectNote("");
    setShowApprove(false);
    setShowReject(false);
  };

  const onApprove = () => {
    /* Logic tetap sama, hanya styling modal yang berubah */
    try {
        // Simulasi confirm dengan custom modal kita, logic asli tetap berjalan
        approveReport(selected.id).then(() => {
             success("Pengajuan berhasil disetujui & diverifikasi");
             closeModal();
             loadReports();
        }).catch(e => error(e.message || "Gagal menyetujui"));
    } catch (e) {
        error(e.message);
    }
  };

  const onReject = async () => {
    if (!rejectNote.trim()) {
      error("Mohon berikan alasan penolakan untuk transparansi");
      return;
    }
    try {
      await rejectReport(selected.id, rejectNote);
      success("Pengajuan telah ditolak");
      closeModal();
      loadReports();
    } catch (e) {
      error(e.message || "Gagal menolak pengajuan");
    }
  };

  return (
    <div className="space-y-8 fade-in-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
             Verifikasi Pura
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tinjau dokumen legalitas dan setujui pengelolaan dana punia.
          </p>
        </div>
      </div>

      {/* Modern Tabs (Segmented Control) */}
      <div className="bg-slate-100 p-1.5 rounded-xl inline-flex flex-wrap gap-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              status === t.id
                ? "bg-white text-slate-800 shadow-sm shadow-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {loading && <div className="p-8 text-center text-slate-400">Memuat data pengajuan...</div>}
        
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <SearchIcon />
            </div>
            <p className="font-medium">Tidak ada pengajuan ditemukan</p>
            <p className="text-xs mt-1">Coba ubah filter status di atas</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Informasi Pura</th>
                  <th className="px-6 py-4">Kontak / Wallet</th>
                  <th className="px-6 py-4">Dokumen Legalitas</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Kolom Informasi Pura */}
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">{r.nama_pura}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 max-w-xs">
                             {r.deskripsi || "Tidak ada deskripsi"}
                        </div>
                    </td>

                    {/* Kolom Kontak & Wallet */}
                    <td className="px-6 py-4 space-y-1">
                       <div className="flex items-center text-slate-600 text-xs font-medium">
                         <span className="w-16 text-slate-400 font-normal">Telepon:</span> 
                         {r.kontak_telepon}
                       </div>
                       <div className="flex items-center text-slate-600 text-xs font-medium">
                         <span className="w-16 text-slate-400 font-normal">Wallet:</span>
                         <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-yellow-700">
                           {formatAddress(r.address_pengaju)}
                         </code>
                       </div>
                    </td>

                    {/* Kolom Dokumen (IPFS) */}
                    <td className="px-6 py-4">
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${r.ipfs_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100 hover:bg-indigo-100 transition-colors"
                      >
                        <DocumentIcon />
                        <span>Lihat Bukti</span>
                        <ExternalLinkIcon />
                      </a>
                    </td>

                    {/* Kolom Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Kolom Aksi */}
                    <td className="px-6 py-4 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelected(r); setShowReject(true); }}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                            title="Tolak Pengajuan"
                          >
                            <XIcon />
                          </button>
                          <button
                            onClick={() => { setSelected(r); setShowApprove(true); }}
                            className="p-2 rounded-lg bg-yellow-400 text-slate-900 font-medium hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-400/30 transition-all shadow-md border border-transparent"
                            title="Setujui Pengajuan"
                          >
                            <CheckIcon />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Approve Modal */}
      {showApprove && (
        <Modal onClose={closeModal}>
          <div className="text-center pt-2">
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <CheckIcon />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Verifikasi Pengajuan</h3>
             <p className="text-sm text-slate-500 mb-6 px-4">
                Apakah Anda yakin data Pura <b>"{selected?.nama_pura}"</b> sudah valid dan sesuai? Tindakan ini akan memberikan akses Admin Pura.
             </p>
             <div className="flex gap-3 justify-center">
                <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                   Batal
                </button>
                <button onClick={onApprove} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all">
                   Ya, Setujui
                </button>
             </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showReject && (
        <Modal onClose={closeModal}>
          <div className="text-left">
             <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                <div className="p-2 bg-red-100 rounded-lg text-red-600"><XIcon /></div>
                <h3 className="text-lg font-bold text-slate-800">Tolak Pengajuan</h3>
             </div>
             
             <label className="block text-sm font-medium text-slate-700 mb-2">Alasan Penolakan</label>
             <textarea
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                rows={4}
                placeholder="Contoh: Dokumen KTP buram, Surat keterangan tidak valid..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                autoFocus
             />
             
             <div className="flex gap-3 justify-end mt-6">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl text-slate-500 text-sm font-medium hover:bg-slate-100 transition-colors">
                   Batalkan
                </button>
                <button onClick={onReject} className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">
                   Tolak Pengajuan
                </button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper Address
function formatAddress(addr) {
    if (!addr) return "-";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}

// Reusable Modal Component with Backdrop Blur
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Panel */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl transform transition-all relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

// Badge Component
function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-500/20",
    APPROVED: "bg-green-50 text-green-700 border-green-200 ring-green-500/20",
    REJECTED: "bg-red-50 text-red-700 border-red-200 ring-red-500/20",
  };
  
  const labels = {
      PENDING: "Menunggu",
      APPROVED: "Disetujui",
      REJECTED: "Ditolak"
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ring-1 ring-inset ${styles[status]}`}>
      {labels[status] || status}
    </span>
  );
}