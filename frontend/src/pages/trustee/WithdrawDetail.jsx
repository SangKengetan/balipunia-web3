import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getWithdrawDetail,
  syncWithdrawVoting,
} from "../../api/trustee.api";
import {
  voteProposal,
  getProposal,
} from "../../services/blockchain/voting";

export default function TrusteeWithdrawDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voting, setVoting] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null); // ready | propose | vote
  const [error, setError] = useState(null);


  // UX voting
  const [hasVoted, setHasVoted] = useState(false);

  // Media Viewer Modal
  const [selectedMedia, setSelectedMedia] = useState(null);

  /* ===============================
       FETCH
  =============================== */
  const refresh = useCallback(async () => {
    const res = await getWithdrawDetail(id);
    setData(res.data ?? res);
  }, [id]);

  const fetchVoting = useCallback(async () => {
    if (!data?.governance_proposal_id) return;

    try {
      const proposal = await getProposal(data.governance_proposal_id);
      setVoting(proposal);

      // Auto-sync jika proposal sudah finalized tapi database masih VOTING_IN_PROGRESS
      if (
        data.status === "VOTING_IN_PROGRESS" &&
        (proposal.status === "APPROVED" || proposal.status === "REJECTED")
      ) {
        try {
          await syncWithdrawVoting(data.id);
          await refresh(); // Refresh data dari database setelah sync
        } catch (syncErr) {
          console.error("Auto-sync gagal:", syncErr);
        }
      }
    } catch (err) {
      console.error("Gagal fetch voting:", err);
    }
  }, [data, refresh]);

  // Initial Load
  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        setError("Gagal memuat data withdraw");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  // Fetch Voting data when proposal ID exists
  useEffect(() => {
    if (data?.governance_proposal_id) {
      fetchVoting();
    }
  }, [data, fetchVoting]);

  /* ===============================
       ACTION HANDLERS
  =============================== */


  const handleVote = async (support) => {
    try {
      setLoadingAction("vote");
      setError(null);

      await voteProposal(data.governance_proposal_id, support);

      setHasVoted(true);

      // Setelah vote, sync ke database (vote ke-2 bisa langsung finalize proposal)
      try {
        await syncWithdrawVoting(data.id);
      } catch (syncErr) {
        console.error("Post-vote sync gagal:", syncErr);
      }

      await refresh();
      await fetchVoting(); // Refresh vote count
    } catch (err) {
      // Decode error ProposalAlreadyFinalized
      const errorData = err?.data || err?.error?.data;
      if (errorData === "0x9c93eb2d" || err?.message?.includes("ProposalAlreadyFinalized")) {
        // Proposal sudah selesai, sync dan refresh
        try {
          await syncWithdrawVoting(data.id);
          await refresh();
          await fetchVoting();
        } catch (syncErr) {
          console.error("Sync setelah finalized gagal:", syncErr);
        }
        setError("Voting sudah selesai — proposal telah di-finalize oleh suara mayoritas Trustee.");
      } else {
        setError(
          err.message || "Anda sudah melakukan vote atau transaksi gagal"
        );
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const isVotingFinalized = voting && (voting.status === "APPROVED" || voting.status === "REJECTED");

  /* ===============================
       LOADING & ERROR STATES
  =============================== */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">Memuat Detail...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-gray-50 h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Data withdraw tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="text-amber-600 font-medium hover:underline">
          &larr; Kembali
        </button>
      </div>
    );
  }

  let parsedSnapshot = null;
  if (data && typeof data.amount_snapshot === "string") {
    try { parsedSnapshot = JSON.parse(data.amount_snapshot); } catch (e) {}
  } else if (data) {
    parsedSnapshot = data.amount_snapshot;
  }
  const isUnified = !!(parsedSnapshot && parsedSnapshot.unified_lpj);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      {/* Top Navigation */}
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">

        {/* HEADER & STATUS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Permintaan Withdraw</h1>
            <p className="text-gray-500 text-sm mt-1">ID Transaksi: <span className="font-mono text-gray-700">#{id}</span></p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-pulse">
            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: INFO & SNAPSHOT */}
          <div className="lg:col-span-2 space-y-6">

            {/* CARD: CAMPAIGN INFO */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Informasi Kampanye</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Judul Kampanye</label>
                  <div className="mt-1 text-lg font-medium text-gray-900">{data.campaign_title}</div>
                </div>

                {/* IPFS Document Link */}
                {!isUnified && data.ipfs_cid && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Dokumen Pendukung</label>
                    <button
                      type="button"
                      onClick={() => setSelectedMedia({ 
                        url: `https://gateway.pinata.cloud/ipfs/${data.ipfs_cid}`, 
                        isImage: false 
                      })}
                      className="w-full text-left group flex items-center p-3 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-amber-700">Bukti Penggunaan Dana</p>
                        <p className="text-xs text-gray-500">Disimpan di IPFS • Klik untuk preview dokumen</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CARD: SNAPSHOT */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Snapshot Saldo</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Saldo yang tercatat pada saat pengajuan withdraw dibuat. Digunakan sebagai acuan validasi.
                </p>
                {renderAmountSnapshot(data.amount_snapshot)}
              </div>
            </div>

            {/* CARD: UNIFIED LPJ (PASCA-KEGIATAN) */}
            {isUnified && (() => {
              const lpj = parsedSnapshot.unified_lpj;
                const formatRp = (val) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
                return (
                  <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider">Rincian Laporan (Pasca-Kegiatan)</h3>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Combined Proposal</span>
                    </div>
                    <div className="p-6 space-y-4 text-sm text-gray-700">
                      <div>
                        <span className="block font-medium text-gray-500 mb-1">Deskripsi Pelaksanaan:</span>
                        <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{lpj.description || "-"}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-bold text-gray-800 border-b pb-1">Sumber Dana (Pemasukan)</p>
                          <div className="flex justify-between"><span>Sistem (Otomatis)</span> <span className="font-mono">{formatRp(lpj.income_system)}</span></div>
                          <div className="flex justify-between"><span>Luar Sistem</span> <span className="font-mono">{formatRp(lpj.income_outside)}</span></div>
                          <div className="flex justify-between"><span>Peturunan Wali</span> <span className="font-mono">{formatRp(lpj.income_peturunan)}</span></div>
                          <div className="flex justify-between font-bold text-emerald-700 pt-2 border-t border-gray-100">
                            <span>Total Pemasukan</span> <span className="font-mono">{formatRp(lpj.total_income)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-gray-800 border-b pb-1">Pengeluaran & Sisa</p>
                          <div className="flex justify-between font-bold text-red-600">
                            <span>Total Pengeluaran</span> <span className="font-mono">{formatRp(lpj.total_expense)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-blue-600 mt-4 pt-4 border-t border-gray-100">
                            <span>Sisa Dana</span> <span className="font-mono">{formatRp(lpj.total_income - lpj.total_expense)}</span>
                          </div>
                        </div>
                      </div>

                      {lpj.media_files && lpj.media_files.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <span className="block font-medium text-gray-500 mb-3">Lampiran Dokumentasi & Nota:</span>
                          <div className="flex flex-wrap gap-3">
                            {lpj.media_files.map((m, idx) => {
                              const url = `https://gateway.pinata.cloud/ipfs/${m.cid}`;
                              const isImage = m.mime_type?.startsWith("image/");
                              return (
                                <button 
                                  key={idx} 
                                  onClick={() => setSelectedMedia({ url, isImage })}
                                  type="button"
                                  className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 hover:ring-2 hover:ring-amber-400 focus:outline-none transition-all"
                                >
                                  {isImage ? (
                                    <img src={url} alt="Lampiran" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center text-red-600 text-xs font-bold">
                                      <svg className="w-6 h-6 mb-1 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                      PDF
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
            })()}
          </div>

          {/* RIGHT COLUMN: ACTION CENTER */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tindakan Diperlukan</h3>



                {/* STATE 2: VOTING */}
                {data.status === "VOTING_IN_PROGRESS" && !isVotingFinalized && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                        <span className="text-sm font-bold text-purple-900">Voting Sedang Berlangsung</span>
                      </div>

                      {/* Voting Stats Visual */}
                      {voting && (
                        <div className="mt-4 space-y-3">
                          <VotingBar
                            label="Setuju (Yes)"
                            count={voting.yesVotes}
                            total={voting.votesCount || 3}
                            color="bg-green-500"
                          />
                          <VotingBar
                            label="Tolak (No)"
                            count={voting.noVotes}
                            total={voting.votesCount || 3}
                            color="bg-red-500"
                          />
                          <p className="text-xs text-center text-gray-500 mt-2">Total Suara Masuk: {voting.votesCount} / 3 Trustee</p>
                        </div>
                      )}
                    </div>

                    {!hasVoted ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 text-center">Berikan keputusan Anda:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleVote(true)}
                            disabled={loadingAction === "vote"}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-green-700 font-medium"
                          >
                            <span className="text-xl mb-1">👍</span>
                            {loadingAction === "vote" ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleVote(false)}
                            disabled={loadingAction === "vote"}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-red-700 font-medium"
                          >
                            <span className="text-xl mb-1">👎</span>
                            {loadingAction === "vote" ? "..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                        <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900">Anda sudah memberikan suara</p>
                        <p className="text-xs text-gray-500">Menunggu trustee lain...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* STATE 3: FINAL */}
                {(isVotingFinalized || ["PENDING_TRANSFER", "COMPLETED", "EXECUTED", "REJECTED"].includes(data.status)) && (
                  <div className={`text-center p-6 rounded-lg border ${(voting?.status === 'REJECTED' || data.status === 'REJECTED') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    {(voting?.status !== 'REJECTED' && data.status !== 'REJECTED') ? (
                      <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-green-800">
                          {data.status === 'COMPLETED' ? "Withdraw Selesai" : "Voting Disetujui"}
                        </h3>
                        <p className="mt-1 text-xs text-green-600">
                          {data.status === 'COMPLETED'
                            ? "Dana telah ditransfer ke rekening Pura."
                            : "Menunggu Super Admin melakukan transfer dana."}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-3">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-red-800">Permintaan Ditolak</h3>
                        <p className="mt-1 text-xs text-red-600">Hasil voting memutuskan untuk menolak permintaan ini.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MEDIA VIEWER MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMedia(null)}>
          <div 
            className="relative bg-white rounded-xl overflow-hidden w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {selectedMedia.isImage ? (
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                )}
                {selectedMedia.isImage ? "Preview Foto" : "Preview Dokumen PDF"}
              </h3>
              <div className="flex gap-2">
                <a 
                  href={selectedMedia.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Buka di tab baru"
                >
                  Buka Penuh
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  title="Tutup"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-800 flex items-center justify-center min-h-[50vh]">
              {selectedMedia.isImage ? (
                <img src={selectedMedia.url} alt="Preview Lengkap" className="max-w-full max-h-[80vh] object-contain rounded shadow-sm bg-transparent" />
              ) : (
                <iframe src={selectedMedia.url} title="PDF Preview" className="w-full h-[80vh] border-0 rounded shadow-sm bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ===============================
   COMPONENTS & HELPERS
=============================== */

function VotingBar({ label, count, total, color }) {
  const percentage = Math.min((count / 3) * 100, 100); // Asumsi max 3 trustee untuk visual
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{count} Suara</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    READY_FOR_VOTING: "bg-blue-100 text-blue-800 border-blue-200",
    VOTING_IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    PENDING_TRANSFER: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    EXECUTED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  const labels = {
    REQUESTED: "Menunggu Review",
    READY_FOR_VOTING: "Siap Voting",
    VOTING_IN_PROGRESS: "Voting Berjalan",
    PENDING_TRANSFER: "Menunggu Transfer",
    COMPLETED: "Selesai",
    EXECUTED: "Selesai",
    REJECTED: "Ditolak"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}

function Spinner({ color = "text-gray-500" }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${color === "white" ? "text-white" : "text-gray-500"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

function renderAmountSnapshot(snapshot) {
  if (!snapshot) {
    return <div className="text-gray-400 italic">Tidak ada data snapshot</div>;
  }

  let data = snapshot;
  if (typeof snapshot === "string") {
    try {
      data = JSON.parse(snapshot);
    } catch (e) {
      // Fallback untuk format lama string
      const usdt = snapshot.match(/USDT:\s*([\d,.]+)/)?.[1] || "0";
      const usdc = snapshot.match(/USDC:\s*([\d,.]+)/)?.[1] || "0";
      data = { crypto: { amount_usdt: usdt, amount_usdc: usdc } };
    }
  }

  const usdt = data.crypto?.amount_usdt || "0";
  const usdc = data.crypto?.amount_usdc || "0";
  const fiat = data.fiat?.amount_idr || "0";

  const formatCrypto = (val) => {
    if (val.includes(".")) return val; // Jika format lama
    return (parseFloat(val) / 1e18).toLocaleString("en-US", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  };

  const formatFiat = (val) => {
    return Number(val).toLocaleString("id-ID");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mr-3">
            $T
          </div>
          <div>
            <p className="text-xs text-gray-500">USDT</p>
            <p className="text-sm font-bold text-gray-900">{formatCrypto(usdt)}</p>
          </div>
        </div>
        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
            $C
          </div>
          <div>
            <p className="text-xs text-gray-500">USDC</p>
            <p className="text-sm font-bold text-gray-900">{formatCrypto(usdc)}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs mr-3">
          Rp
        </div>
        <div>
          <p className="text-xs text-gray-500">Fiat (Midtrans)</p>
          <p className="text-sm font-bold text-gray-900">{formatFiat(fiat)}</p>
        </div>
      </div>
      {data.total_idr && (
        <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <span className="text-xs font-bold text-emerald-800">Total Pencairan IDR Bersih:</span>
          <span className="text-sm font-mono font-bold text-emerald-900">Rp {Number(data.total_idr).toLocaleString("id-ID")}</span>
        </div>
      )}
    </div>
  );
}