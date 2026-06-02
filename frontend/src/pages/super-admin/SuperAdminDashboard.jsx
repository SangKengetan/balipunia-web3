import { NavLink, Outlet } from "react-router-dom";

export default function SuperAdminDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar - Sticky Position agar tetap terlihat saat scroll */}
      <aside className="sticky top-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        
        {/* 1. Header & Logo Area */}
        <div className="p-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Placeholder Logo Icon */}
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20 text-white font-bold text-xl">
              B
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-none">
                BaliPunia
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* 2. Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {/* Label Group (Optional, bagus untuk kerapian jika menu banyak) */}
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>

          <MenuLink to="/admin/super/dashboard" icon={<DashboardIcon />}>
            Dashboard
          </MenuLink>
          <MenuLink to="/admin/super/reports" icon={<FileTextIcon />}>
            Pengajuan Pura
          </MenuLink>
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Management
            </p>
          </div>

          <MenuLink to="/admin/super/admins" icon={<UsersIcon />}>
            Admin Management
          </MenuLink>
          <MenuLink to="/admin/super/offchain" icon={<WalletIcon />}>
            Offchain Withdrawal
          </MenuLink>
          <MenuLink to="/admin/super/withdraws" icon={<BanknoteIcon />}>
            Pencairan Dana
          </MenuLink>
        </nav>

        {/* 3. Footer / User Profile */}
        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-200 transition-all">
               <LogoutIcon />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">Keluar</p>
              <p className="text-xs text-slate-500">Super Admin Session</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-50/50">
        <div className="p-8 max-w-7xl mx-auto">
           <Outlet />
        </div>
      </main>
    </div>
  );
}

// --- Reusable Menu Link Component ---
function MenuLink({ to, children, icon }) {
  return (
    <NavLink
      to={to}
      end // Penting agar Dashboard tidak selalu aktif jika path nested
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
          isActive
            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-400/20"
            : "text-slate-600 hover:bg-yellow-50 hover:text-yellow-700"
        }`
      }
    >
      {/* Icon Wrapper: Ubah warna icon berdasarkan state */}
      {({ isActive }) => (
        <>
          <span className={`transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-yellow-600"}`}>
            {icon}
          </span>
          <span className="flex-1">{children}</span>
          
          {/* Chevron Right kecil saat hover (Nice-to-have micro interaction) */}
          {!isActive && (
            <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-yellow-600">
              <ChevronRightIcon />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}


// --- Icons Collection (Inline SVG) ---
// Menggunakan style stroke yang konsisten (1.5px stroke width)

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const BanknoteIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
    <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 9h2m16 0h2M2 15h2m16 0h2" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);