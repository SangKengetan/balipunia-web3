import { useEffect, useMemo, useState } from "react";
import { getTrusteeWithdraws } from "../../api/trustee.api";
import { useNavigate } from "react-router-dom";

/* ===============================
   STATUS CONFIGURATION
   (Diselaraskan dengan Theme Modern)
================================ */
const STATUS_CONFIG = {
  REQUESTED: {
    label: "Menunggu Review",
    style: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: (
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  VOTING_IN_PROGRESS: {
    label: "Sedang Voting",
    style: "bg-purple-50 text-purple-700 border border-purple-200",
    icon: (
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  COMPLETED: {
    label: "Selesai (Cair)",
    style: "bg-green-50 text-green-700 border border-green-200",
    icon: (
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  REJECTED: {
    label: "Ditolak",
    style: "bg-red-50 text-red-700 border border-red-200",
    icon: (
      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export default function TrusteeWithdrawDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ===============================
       FETCH DATA
  ================================ */
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getTrusteeWithdraws();
        setData(res.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* ===============================
       SUMMARY CALCULATION
  ================================ */
  const summary = useMemo(() => {
    const counts = {
      REQUESTED: 0,
      VOTING_IN_PROGRESS: 0,
      COMPLETED: 0,
      REJECTED: 0,
    };
    data.forEach((w) => {
      // Mapping back compatibility and logic combinations
      if (w.status === "REQUESTED") counts.REQUESTED++;
      else if (w.status === "READY_FOR_VOTING" || w.status === "VOTING_IN_PROGRESS") counts.VOTING_IN_PROGRESS++;
      else if (w.status === "EXECUTED" || w.status === "COMPLETED") counts.COMPLETED++;
      else if (w.status === "REJECTED") counts.REJECTED++;
    });
    return counts;
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500">Memuat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Trustee Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Kelola persetujuan dan voting pencairan dana kampanye secara transparan.
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <SummaryCard
            label="Menunggu Review"
            value={summary.REQUESTED}
            colorClass="bg-yellow-500"
            icon={STATUS_CONFIG.REQUESTED.icon}
          />
          <SummaryCard
            label="Sedang Voting"
            value={summary.VOTING_IN_PROGRESS}
            colorClass="bg-purple-500"
            icon={STATUS_CONFIG.VOTING_IN_PROGRESS.icon}
          />
          <SummaryCard
            label="Selesai (Cair)"
            value={summary.COMPLETED}
            colorClass="bg-green-500"
            icon={STATUS_CONFIG.COMPLETED.icon}
          />
          <SummaryCard
            label="Ditolak"
            value={summary.REJECTED}
            colorClass="bg-red-500"
            icon={STATUS_CONFIG.REJECTED.icon}
          />
        </div>

        {/* MAIN TABLE CARD */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Daftar Permintaan Withdraw
            </h3>
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
              Total: {data.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Campaign Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID Transaksi
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Aksi</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>Belum ada permintaan withdraw saat ini.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {data.map((w) => {
                  const config = STATUS_CONFIG[w.status] || {};
                  return (
                    <tr key={w.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                           {/* Placeholder Icon Campaign */}
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{w.campaign_title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Diajukan: {new Date().toLocaleDateString('id-ID')}</div> {/* Simulasi tanggal jika tidak ada di data */}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.style}`}>
                          {config.icon}
                          {config.label || w.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-mono">
                        #{w.id.toString().padStart(6, '0')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/trustee/withdraw/${w.id}`)}
                          className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all hover:text-amber-600 hover:ring-amber-300"
                        >
                          Lihat Detail
                          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   MODERN SUMMARY CARD COMPONENT
================================ */
function SummaryCard({ label, value, colorClass, icon }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
      <div className="flex items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass} text-white shadow-sm`}>
            {/* Clone element icon agar bisa di-styling ukurannya jika perlu, atau render langsung */}
            <div className="h-6 w-6">
                {icon}
            </div>
        </div>
        <div className="ml-4">
          <p className="truncate text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {/* Dekorasi halus di background */}
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 ${colorClass}`}></div>
    </div>
  );
}