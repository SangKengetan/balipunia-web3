import { useEffect, useState } from "react";
import { getMyCampaigns, getProfile } from "../../api/adminPura.api"; 
import { Link } from "react-router-dom";
import { showInfo } from "../../utils/notification";
import { 
  Calendar, 
  Coins, 
  Plus, 
  Banknote, 
  Clock, 
  CheckCircle2,
  Wallet,
  Globe,
  ArrowRight
} from "lucide-react";

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCrypto = (val) => {
  if (!val) return "0.00";
  return (parseFloat(val) / 1e18).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyCampaigns(), getProfile()])
      .then(([campRes, profRes]) => {
        setCampaigns(campRes.data);
        const pData = profRes.data?.data || profRes.data || {};
        setProfileCompletion(pData.profile_completion_percentage || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse font-sans">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="space-y-8 font-sans pb-10">
      {/* Header Page */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Kegiatan Pura</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lihat dan kelola semua kegiatan penggalangan dana pura Anda.
          </p>
        </div>
        {profileCompletion === 100 ? (
          <Link
            to="create"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Buat Kegiatan Baru</span>
          </Link>
        ) : (
          <button
            onClick={() => showInfo("Profil Belum Lengkap", "Harap lengkapi profil Anda hingga 100% (termasuk pendaftaran Trustee) di menu Profil untuk dapat membuat kegiatan baru.")}
            className="flex items-center gap-2 bg-gray-300 text-gray-500 px-5 py-3 rounded-xl font-medium cursor-not-allowed"
          >
            <Plus size={20} />
            <span>Buat Kegiatan Baru</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Belum ada kegiatan</h3>
          <p className="text-gray-500 mt-1">Silakan buat kegiatan baru untuk mulai menerima punia.</p>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const activeOrCompletedStatuses = [
            "REQUEST WITHDRAW",
            "PENDING_TRANSFER",
            "WITHDRAWN",
            "COMPLETED",
            "REPORTED",
          ];
          
          const hasNoDeadline = !c.deadline;
          const isExpired = c.deadline && now > new Date(c.deadline);
          
          const canShowWithdrawButton =
            (isExpired || hasNoDeadline) &&
            !activeOrCompletedStatuses.includes(c.status);

          const getStatusDisplay = (campaign) => {
            const { status, deadline } = campaign;
            if (status === 'REPORTED') return { label: 'Telah Dilaporkan', style: 'bg-amber-100 text-amber-800 border-amber-200' };
            if (status === 'WITHDRAWN') return { label: 'Telah Dicairkan', style: 'bg-blue-100 text-blue-800 border-blue-200' };
            if (status === 'ACTIVE') {
              if (deadline && new Date(deadline) < new Date()) {
                return { label: 'Belum Dicairkan', style: 'bg-gray-100 text-gray-800 border-gray-200' };
              }
              return { label: 'Sedang Berjalan', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            }
            if (status === 'REQUEST WITHDRAW') return { label: 'Pencairan Diproses', style: 'bg-orange-100 text-orange-800 border-orange-200' };
            if (status === 'COMPLETED') return { label: 'Telah Selesai', style: 'bg-blue-100 text-blue-800 border-blue-200' };
            return { label: status || 'Unknown', style: 'bg-gray-100 text-gray-800 border-gray-200' };
          };

          const statusInfo = getStatusDisplay(c);

          return (
            <div
              key={c.id}
              className="group relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 p-5"
            >
              {/* Campaign Image / PDF Preview */}
              {c.image_url && (() => {
                const fullUrl = c.image_url.startsWith('http') ? c.image_url : `${import.meta.env.VITE_API_BASE_URL}${c.image_url}`;
                const isPdf = c.image_url.toLowerCase().endsWith('.pdf');
                
                return (
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden shrink-0 relative bg-gray-50">
                    {isPdf ? (
                      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-500">
                        <svg className="w-12 h-12 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-500">Dokumen PDF</span>
                      </div>
                    ) : (
                      <img 
                        src={fullUrl} 
                        alt={c.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-between items-start mb-4 px-2">
                 <div className="flex flex-col gap-2">
                   <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${statusInfo.style} self-start`}>
                     {statusInfo.label}
                   </span>
                   {c.purpose && (
                     <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200 self-start capitalize">
                       {c.purpose.toLowerCase().replace(/_/g, " ")}
                     </span>
                   )}
                 </div>
                 
                 {/* Badge Tipe Metode */}
                 <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                   {c.campaign_type === 'HYBRID' ? 'Rupiah & Kripto' : c.campaign_type === 'MIDTRANS_ONLY' ? 'Hanya Rupiah' : 'Hanya Kripto'}
                 </span>
              </div>

              <div className="flex flex-col flex-1 px-2">
                <Link to={`/admin/pura/campaigns/${c.id}`} className="block">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                    {c.title}
                  </h3>
                </Link>

                <div className="mt-auto flex flex-col gap-4">
                  {/* Tenggat Waktu */}
                  <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar size={16}/> Tenggat Waktu
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(c.deadline)}
                    </span>
                  </div>

                  {/* Saldo Kripto (Jika Ada) */}
                  {c.campaign_type !== 'MIDTRANS_ONLY' && c.onchain_info?.balance_usdt !== undefined && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      <span className="text-xs text-gray-500 block mb-2 font-medium">Saldo Kripto Terkumpul:</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                           <span className="font-bold text-sm">{formatCrypto(c.onchain_info.balance_usdt)}</span>
                           <span className="text-xs">USDT</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded text-blue-700">
                           <span className="font-bold text-sm">{formatCrypto(c.onchain_info.balance_usdc)}</span>
                           <span className="text-xs">USDC</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-2">
                    {canShowWithdrawButton ? (
                      <Link
                        to={`/admin/pura/withdraw/request/${c.id}`}
                        className="flex w-full items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        <Coins size={18} /> {c.fund_mechanism === "PASCA_KEGIATAN" ? "Lapor & Cairkan Dana" : "Rencana Pencairan Dana"}
                      </Link>
                    ) : (
                      <Link
                        to={`/admin/pura/campaigns/${c.id}`}
                        className="flex w-full items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        Lihat Detail Kegiatan <ArrowRight size={16} className="text-gray-400"/>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}