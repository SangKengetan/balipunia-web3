import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Megaphone, 
  Landmark, 
  FileText, 
  Wallet, 
  LogOut 
} from "lucide-react"; // Import ikon agar UI lebih informatif

const menu = [
  { name: "Dashboard", path: "/admin/pura", icon: <LayoutDashboard size={20} /> },
  { name: "Campaign", path: "/admin/pura/campaigns", icon: <Megaphone size={20} /> },
  { name: "Profile Pura", path: "/admin/pura/profile", icon: <Landmark size={20} /> },
  { name: "Reports", path: "/admin/pura/financereports", icon: <FileText size={20} /> },
  { name: "Withdraw", path: "/admin/pura/withdraws", icon: <Wallet size={20} /> },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 font-sans">
      {/* 1. Header: Branding yang Konsisten */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        {/* Placeholder Logo Kecil */}
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
          B
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">Admin Pura</h1>
          <p className="text-xs text-gray-400 font-medium">BaliPunia Panel</p>
        </div>
      </div>

      {/* 2. Menu Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin/pura"} // Exact match hanya untuk root dashboard
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-amber-50 text-amber-700 font-semibold shadow-sm border-l-4 border-amber-500" // Active State: Soft Amber + Border accent
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900" // Inactive State
              }`
            }
          >
            {/* Icon dengan pewarnaan dinamis */}
            <span className={({ isActive }) => (isActive ? "text-amber-600" : "text-gray-400 group-hover:text-gray-600")}>
              {item.icon}
            </span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* 3. Footer: User Info & Logout */}
      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}