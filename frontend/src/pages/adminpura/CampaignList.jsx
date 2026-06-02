import { useEffect, useState } from "react";
import { getMyCampaigns, getProfile } from "../../api/adminPura.api"; 
import { Link } from "react-router-dom";
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
            onClick={() => alert("Harap lengkapi profil Anda hingga 100% (termasuk pendaftaran Trustee) di menu Profil untuk dapat membuat kegiatan baru.")}
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
          <p className="text-gray-500 mt-1">Silakan buat kegiatan baru untuk mulai menerima donasi.</p>
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

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative group"
            >
              {/* Highlight bar di atas */}
              <div className={`h-1.5 w-full ${isExpired ? 'bg-gray-400' : 'bg-amber-500'}`}></div>

              {/* === CARD HEADER === */}
              <div className="px-6 pt-5 pb-3 border-b border-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold uppercase">
                        <CheckCircle2 size={14} /> Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs font-semibold uppercase">
                        <Clock size={14} /> Aktif
                      </span>
                    )}
                  </div>
                  
                  {/* Badge Tipe Metode */}
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                    {c.campaign_type === 'HYBRID' ? 'Rupiah & Kripto' : c.campaign_type === 'MIDTRANS_ONLY' ? 'Hanya Rupiah' : 'Hanya Kripto'}
                  </span>
                </div>

                <Link to={`/admin/pura/campaigns/${c.id}`} className="block mt-3">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {c.title}
                  </h2>
                </Link>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {c.purpose}
                </p>
              </div>

              {/* === CARD BODY: Summary === */}
              <div className="px-6 py-4 flex-1 bg-gray-50/50">
                <div className="flex flex-col gap-3">
                  {/* Tenggat Waktu */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar size={16}/> Tenggat Waktu
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatDate(c.deadline)}
                    </span>
                  </div>

                  {/* Saldo Kripto (Jika Ada) */}
                  {c.campaign_type !== 'MIDTRANS_ONLY' && c.onchain_info?.balance_usdt !== undefined && (
                    <div className="mt-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      <span className="text-xs text-gray-500 block mb-2 font-medium">Saldo Kripto Terkumpul:</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded text-green-700">
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

                  {c.campaign_type === 'MIDTRANS_ONLY' && (
                     <div className="mt-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                        <span className="text-xs text-gray-500 block font-medium">Penggalangan Dana Rupiah</span>
                        <p className="text-xs text-gray-400 mt-1">Cek detail untuk melihat jumlah donasi.</p>
                     </div>
                  )}
                </div>
              </div>

              {/* === CARD FOOTER: Actions === */}
              <div className="px-6 py-4 bg-white border-t border-gray-100">
                {canShowWithdrawButton ? (
                  <Link
                    to={`/admin/pura/withdraw/request/${c.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    <Coins size={18} /> Cairkan Dana
                  </Link>
                ) : (
                  <Link
                    to={`/admin/pura/campaigns/${c.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    Lihat Detail Kegiatan <ArrowRight size={16} className="text-gray-400"/>
                  </Link>
                )}
                
                {/* Status Khusus */}
                {c.status === "REQUEST WITHDRAW" && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-full w-full">
                      <Clock size={14}/> Pencairan Diproses
                    </span>
                  </div>
                )}
                {(c.status === "WITHDRAWN" || c.status === "COMPLETED") && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full w-full">
                      <CheckCircle2 size={14}/> Dana Telah Dicairkan
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}