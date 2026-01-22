import { useEffect, useState } from "react";
import { getMyCampaigns } from "../../api/adminPura.api"; 
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Coins, 
  Plus, 
  Banknote, // Icon untuk Off-chain
  Clock, 
  CheckCircle2,
  Wallet,
  Globe // Icon alternatif untuk Web3
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
  return (parseFloat(val) / 1000000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCampaigns()
      .then((res) => setCampaigns(res.data))
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
    <div className="space-y-6 font-sans">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Kampanye</h1>
          <p className="text-sm text-gray-500">
            Kelola penggalangan dana (Hybrid & Fiat) pura Anda di sini.
          </p>
        </div>
        <Link
          to="create"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-amber-200 hover:shadow-md"
        >
          <Plus size={20} />
          <span>Buat Campaign</span>
        </Link>
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Belum ada kampanye</h3>
          <p className="text-gray-500 mt-1">Silakan buat kampanye baru untuk memulai.</p>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const deadline = c.deadline ? new Date(c.deadline) : null;
          const isExpired = deadline && now > deadline;
          
          // Logic Tombol Withdraw (Hanya relevan untuk On-chain/Web3)
          const canShowWithdrawButton =
            c.is_onchain_enabled &&
            c.is_sc_registered &&
            isExpired &&
            c.status !== "REQUEST_WD";

          return (
            <div
              key={c.id}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* === CARD HEADER: Badges === */}
              <div className="px-5 pt-5 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Badge 1: Status Waktu */}
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
                      <CheckCircle2 size={12} /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                      <Clock size={12} /> Aktif
                    </span>
                  )}

                  {/* Badge 2: On-chain (Web3) */}
                  {c.is_onchain_enabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                      <Globe size={12} /> Web3
                    </span>
                  )}

                  {/* Badge 3: Off-chain (Fiat) */}
                  {/* Asumsi: Ada flag 'is_offchain_enabled' atau default true */}
                  {(c.is_offchain_enabled !== false) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                      <Banknote size={12} /> Fiat
                    </span>
                  )}
                </div>
              </div>

              {/* === CARD BODY: Content === */}
              <div className="px-5 pb-5 flex-1">
                <Link to={`/admin/pura/campaigns/${c.id}`} className="block mt-2 group-hover:text-amber-600 transition-colors">
                  <h2 className="text-lg font-bold text-gray-800 leading-snug line-clamp-2">
                    {c.title}
                  </h2>
                </Link>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 min-h-[40px]">
                  {c.purpose}
                </p>

                {/* Crypto Balance Section (Hanya tampil jika On-chain aktif) */}
                {c.is_onchain_enabled && c.onchain_info?.balance_usdt !== undefined && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Wallet size={12} /> Vault Balance
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <div>
                         <span className="text-[10px] text-gray-500 block uppercase">USDT</span>
                         <span className="font-mono text-sm font-semibold text-gray-800">
                            {formatCrypto(c.onchain_info.balance_usdt)}
                         </span>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div className="text-right">
                         <span className="text-[10px] text-gray-500 block uppercase">USDC</span>
                         <span className="font-mono text-sm font-semibold text-gray-800">
                            {formatCrypto(c.onchain_info.balance_usdc)}
                         </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* === CARD FOOTER: Actions === */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>Deadline: {formatDate(c.deadline)}</span>
                    </div>
                </div>

                {/* Logic Tombol: Prioritaskan Withdraw jika Web3, jika tidak tampilkan Lihat Detail */}
                {canShowWithdrawButton ? (
                  <Link
                    to={`/admin/pura/withdraw/request/${c.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Coins size={16} /> Ajukan Withdraw
                  </Link>
                ) : (
                  <div className="w-full text-center">
                     {/* Jika Campaign masih aktif atau tipe Fiat Only, tampilkan status/info text */}
                     <span className="text-xs text-gray-400 select-none">
                        {c.status === "REQUEST_WD" ? (
                           <span className="text-blue-600 font-medium flex items-center justify-center gap-1">
                              <Clock size={12}/> Withdraw Sedang Diproses
                           </span>
                        ) : !isExpired ? (
                           "Sedang Berlangsung..."
                        ) : !c.is_onchain_enabled ? (
                           "Pengelolaan Dana Fiat via Laporan"
                        ) : (
                           "Belum Terdaftar Smart Contract"
                        )}
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