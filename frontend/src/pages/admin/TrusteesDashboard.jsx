import useAdminAuth from "../../hooks/useAdminAuth";

export default function TrusteesDashboard() {
  const { adminWallet, logoutAdmin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard Trustees
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Wallet: {adminWallet}
      </p>

      <div className="bg-white p-6 rounded-xl shadow mb-4">
        <h2 className="font-semibold mb-2">
          Audit & Transparansi
        </h2>
        <p className="text-sm text-gray-600">
          Lihat laporan penggunaan dana dan transaksi on-chain.
        </p>
      </div>

      <button
        onClick={logoutAdmin}
        className="text-sm text-red-500 underline"
      >
        Logout
      </button>
    </div>
  );
}
