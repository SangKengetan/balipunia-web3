import useAdminAuth from "../../hooks/useAdminAuth";

export default function AdminPuraDashboard() {
  const { adminWallet, logoutAdmin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard Admin Pura
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Wallet: {adminWallet}
      </p>

      <div className="grid gap-4">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-2">
            Kelola Campaign
          </h2>
          <p className="text-sm text-gray-600">
            Buat dan kelola campaign donasi.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-2">
            Request Penarikan Dana
          </h2>
          <p className="text-sm text-gray-600">
            Ajukan penarikan dana berdasarkan kebutuhan.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-2">
            Upload Laporan
          </h2>
          <p className="text-sm text-gray-600">
            Unggah laporan ke IPFS untuk transparansi.
          </p>
        </div>
      </div>

      <button
        onClick={logoutAdmin}
        className="mt-6 text-sm text-red-500 underline"
      >
        Logout
      </button>
    </div>
  );
}
