import { useEffect, useState } from "react";
import {
  fetchAdmins,
  createAdmin,
  toggleAdmin,
  deleteAdmin,
} from "../../api/superAdmin.api";
import useToast from "../../hooks/useToast";

export default function AdminManagement() {
  const { success, error, confirm } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("ADMIN_PURA");

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetchAdmins();
      setAdmins(res.data.data);
    } catch (err) {
      // Handle error silently or show toast, visual error handled in table empty state
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  /* --- HANDLERS --- */
  const handleCreate = async () => {
    if (!address) {
      error("Wallet address wajib diisi");
      return;
    }
    try {
      await createAdmin({ address, role });
      success("Admin berhasil ditambahkan ke dalam sistem");
      setAddress("");
      setRole("ADMIN_PURA");
      loadAdmins();
    } catch (err) {
      error(err.message || "Gagal membuat admin");
    }
  };

  const handleToggle = (id) => {
    confirm("Ubah status keaktifan admin ini?", async () => {
      try {
        await toggleAdmin(id);
        success("Status admin diperbarui");
        loadAdmins();
      } catch (err) {
        error(err.message || "Gagal mengubah status");
      }
    });
  };

  const handleDelete = (id) => {
    confirm("Hapus admin ini secara permanen?", async () => {
      try {
        await deleteAdmin(id);
        success("Admin dihapus dari sistem");
        loadAdmins();
      } catch (err) {
        error(err.message || "Gagal menghapus admin");
      }
    });
  };

  return (
    <div className="space-y-8 fade-in-enter">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Admin Management
          </h1>
          <p className="text-slate-500 mt-1">
            Atur peran akses untuk Super Admin, Admin Pura, dan Trustee.
          </p>
        </div>
        <div className="hidden md:block">
           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
             Total Admin: {admins.length}
           </span>
        </div>
      </div>

      {/* Action Card: Create Admin */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>

        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserPlusIcon /> Tambah Admin Baru
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6 space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Wallet Address</label>
            <div className="relative">
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-400/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Role / Peran</label>
             <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-400/20 transition-all appearance-none"
              >
                <option value="ADMIN_PURA">Admin Pura (Yayasan)</option>
                <option value="TRUSTEE">Trustee (Validator)</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                 <ChevronDownIcon />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleCreate}
              className="w-full rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-6 py-2.5 text-sm font-bold shadow-lg shadow-yellow-400/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
             <p>Belum ada data admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Wallet Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((a) => (
                  <tr key={a.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                           <UserIcon />
                         </div>
                         <div>
                            <p className="font-mono text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 inline-block">
                              {formatAddress(a.address)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: {a.id}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={a.role} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        a.is_active 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? "bg-green-500" : "bg-slate-400"}`}></span>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(a.id)}
                          title={a.is_active ? "Nonaktifkan" : "Aktifkan"}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <SwitchIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          title="Hapus Permanen"
                          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
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

/* --- COMPONENTS & UTILS --- */

// Helper untuk memendekkan address
function formatAddress(addr) {
  if (!addr) return "-";
  return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
}

function RoleBadge({ role }) {
  const styles = {
    SUPER_ADMIN: "bg-slate-800 text-white border-slate-600", // Dark themed for highest authority
    ADMIN_PURA: "bg-yellow-100 text-yellow-800 border-yellow-200", // Gold brand color
    TRUSTEE: "bg-indigo-100 text-indigo-800 border-indigo-200", // Trust/Validator color
  };

  return (
    <span
      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
        styles[role] || "bg-slate-100 text-slate-600"
      }`}
    >
      {role.replace('_', ' ')}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-slate-50 rounded-xl w-full"></div>
      ))}
    </div>
  );
}

/* --- ICONS --- */
const UserPlusIcon = () => (
  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const SwitchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
);