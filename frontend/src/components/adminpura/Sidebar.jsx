import { NavLink } from "react-router-dom";

const menu = [
  { name: "Dashboard", path: "/admin/pura" },
  { name: "Campaign", path: "/admin/pura/campaigns" },
  { name: "Profile Pura", path: "/admin/pura/profile" },
  { name: "Reports", path: "/admin/pura/financereports" },
  { name: "Withdraw", path: "/admin/pura/withdraws" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md">
      {/* Header */}
      <div className="p-6 font-bold text-lg border-b">
        Admin Pura
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
