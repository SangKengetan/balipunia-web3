import React from "react";

export default function SummaryCards({ admin = {}, report = {} }) {
  // Kita kelompokkan konfigurasi kartu agar kode lebih bersih (Clean Code)
  // dan mudah di-maintenance.
  
  const cardData = [
    // --- Baris 1: Role / Entitas (Nuansa Biru/Emas Professional) ---
    {
      title: "Super Admin",
      value: admin.SUPER_ADMIN ?? 0,
      icon: <ShieldCheckIcon />,
      color: "blue", 
      description: "Total administrator utama"
    },
    {
      title: "Admin Pura",
      value: admin.ADMIN_PURA ?? 0,
      icon: <TempleIcon />, // Custom icon representation
      color: "gold", // Brand Color BaliPunia
      description: "Pura/Yayasan terdaftar"
    },
    {
      title: "Trustee (Trustless)",
      value: admin.TRUSTEE ?? 0,
      icon: <KeyIcon />,
      color: "indigo",
      description: "Voting & Pemantau"
    },
    
    // --- Baris 2: Status Pengajuan (Nuansa Semantik Status) ---
    {
      title: "Menunggu (Pending)",
      value: report.PENDING ?? 0,
      icon: <ClockIcon />,
      color: "yellow", // Warning/Waiting state
      description: "Perlu verifikasi segera"
    },
    {
      title: "Disetujui (Approved)",
      value: report.APPROVED ?? 0,
      icon: <CheckCircleIcon />,
      color: "green", // Success state
      description: "Telah lolos verifikasi"
    },
    {
      title: "Ditolak (Rejected)",
      value: report.REJECTED ?? 0,
      icon: <XCircleIcon />,
      color: "red", // Error state
      description: "Tidak memenuhi syarat"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cardData.map((item, index) => (
        <StatCard key={index} {...item} />
      ))}
    </div>
  );
}

// Komponen Kartu Reusable dengan Dynamic Styling
function StatCard({ title, value, icon, color, description }) {
  // Mapping warna background ikon agar terlihat "soft" namun ikonnya tajam
  const colorVariants = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    gold: "bg-yellow-50 text-yellow-600 border-yellow-200", // Mengarah ke Emas
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    yellow: "bg-orange-50 text-orange-600 border-orange-100", // Orange sering lebih mudah dibaca daripada pure yellow
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      
      {/* Dekorasi Background Circle (Web 3.0 aesthetic) */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorVariants[color].split(" ")[1].replace('text', 'bg')}`}></div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-slate-400 mt-1 font-light">
              {description}
            </p>
          )}
        </div>

        {/* Icon Container */}
        <div className={`p-3 rounded-xl border ${colorVariants[color]} shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- Icons (SVG Inline untuk kemudahan copy-paste tanpa library tambahan) ---

const ShieldCheckIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const TempleIcon = () => (
  // Representasi simbolis bangunan/pura
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);