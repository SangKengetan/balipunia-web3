import { NavLink } from "react-router-dom";
import useAdminAuth from "../hooks/useAdminAuth";

export default function Sidebar() {
  const { role, adminWallet, logoutAdmin } = useAdminAuth();

  const menuByRole = {
    ADMIN_PURA: [
      { label: "Dashboard", to: "/admin/pura" },
      { label: "Kelola Campaign", to: "/admin/pura/campaigns" },
      { label: "Request Penarikan Dana", to: "#" },
      { label: "Upload Laporan", to: "#" },
    ],
    SUPER_ADMIN: [
      { label: "Dashboard", to: "/admin/super" },
      { label: "Approval Withdraw", to: "#" },
    ],
    TRUSTEES: [
      { label: "Dashboard", to: "/admin/trustees" },
      { label: "Voting Penarikan Dana", to: "#" },
    ],
  };

  const menus = menuByRole[role] || [];

  return (
    <aside className="w-64 bg-white shadow p-6 flex flex-col">
      <h2 className="text-lg font-bold mb-6">Dashboard</h2>

      <nav className="flex-1 space-y-2 text-sm">
        {menus.map((m) => (
          <NavLink
            key={m.label}
            to={m.to}
            className={({ isActive }) =>
              isActive
                ? "block font-semibold text-blue-600"
                : "block text-gray-700"
            }
          >
            {m.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 text-xs text-gray-500 break-all">
        Wallet:
        <div className="mt-1">{adminWallet}</div>
      </div>

      <button
        onClick={logoutAdmin}
        className="mt-4 text-sm text-red-500 underline"
      >
        Logout
      </button>
    </aside>
  );
}
