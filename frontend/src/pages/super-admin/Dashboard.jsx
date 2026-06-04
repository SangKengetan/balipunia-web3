import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../../api/superAdmin.api";
import SummaryCards from "../../components/super-admin/SummaryCards";

// Ikon sederhana untuk UX yang lebih baik (opsional, bisa diganti library icon)
const EmptyStateIcon = () => (
  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await fetchDashboardSummary();
        setSummary(res.data);
      } catch (err) {
        setError(err.message || "Gagal memuat dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <p className="text-red-600 font-medium mb-2">Terjadi Kesalahan</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-sm text-yellow-600 hover:text-yellow-700 font-medium underline"
        >
          Coba Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in-enter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Super Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan data, verifikasi pengajuan, dan pantauan aktivitas wallet.
          </p>
        </div>
        {/* Bisa ditambahkan filter tanggal atau tombol action disini jika perlu */}
      </div>

      {/* Summary Cards */}
      {/* Pastikan komponen SummaryCards juga menggunakan styling rounded-2xl dan shadow-sm agar konsisten */}
      <SummaryCards
        admin={summary.admin_summary}
        report={summary.report_summary}
      />

      {/* Latest Reports Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            Pengajuan Terbaru
          </h2>
          <button className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition-colors">
            Lihat Semua
          </button>
        </div>

        {summary.latest_reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <EmptyStateIcon />
            <p className="text-sm text-gray-500 font-medium">Belum ada pengajuan masuk.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Nama Pura</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Wallet Address</th>
                  <th className="px-6 py-4 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.latest_reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {r.nama_pura}
                      {/* Optional: Add subtitle for context */}
                      <span className="block text-xs text-gray-400 font-normal mt-0.5">
                        ID: #{r.id.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Font Mono penting untuk Wallet Address agar mudah dibaca */}
                        <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border border-gray-200">
                          {formatWalletAddress(r.address_pengaju)}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {new Date(r.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
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

/* Utility: Shorten Wallet Address 
  Web3 UX Standard: Tampilkan awal dan akhir address saja.
*/
function formatWalletAddress(address) {
  if (!address) return "-";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/* Reusable Badge - Updated Colors to Match Theme */
function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200", // Menggunakan warna tema emas/kuning
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };

  const defaultStyle = "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || defaultStyle
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'PENDING' ? 'bg-yellow-500' : 
        status === 'APPROVED' ? 'bg-green-500' : 
        status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'
      }`}></span>
      {status}
    </span>
  );
}

/* Skeleton Loading Component for better UX */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-100 rounded"></div>
      </div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-50 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}