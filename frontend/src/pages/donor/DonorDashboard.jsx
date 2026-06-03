import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useDonorAuth from "../../hooks/useDonorAuth";
import useWallet from "../../hooks/useWallet";
import Navbar from "../../components/Navbar";

export default function DonorDashboard() {
  const navigate = useNavigate();
  const { 
    donorToken, 
    donorEmail, 
    donorName, 
    donorWallet, 
    logoutDonor, 
    updateWalletAddress 
  } = useDonorAuth();

  const { address, connectWallet } = useWallet();

  const [donations, setDonations] = useState({ offchain: [], onchain: [] });
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [activeTab, setActiveTab] = useState("offchain");
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(\`${import.meta.env.VITE_API_BASE_URL}/api/payments/my-donations\`, {
        headers: {
          Authorization: `Bearer ${donorToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil riwayat donasi");
      }

      const data = await res.json();
      setDonations(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!donorToken) {
      navigate("/donor/login");
      return;
    }
    fetchHistory();
  }, [donorToken, donorWallet]);

  const handleLinkWallet = async () => {
    try {
      setLinking(true);
      const walletAddr = await connectWallet();
      if (!walletAddr) {
        alert("Gagal menghubungkan wallet");
        return;
      }

      // Save to backend
      const res = await fetch(\`${import.meta.env.VITE_API_BASE_URL}/auth/donor/wallet\`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${donorToken}`,
        },
        body: JSON.stringify({ wallet_address: walletAddr }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan wallet address ke akun");
      }

      updateWalletAddress(walletAddr);
      alert("Wallet berhasil dikaitkan ke akun donatur Anda!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal mengaitkan wallet.");
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = () => {
    logoutDonor();
    navigate("/");
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar address={address} onConnect={connectWallet} />

      <div className="max-w-6xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-lg">
                  {donorName ? donorName.charAt(0).toUpperCase() : "D"}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 leading-tight">
                    Halo, {donorName || "Donatur"}
                  </h1>
                  <p className="text-sm text-gray-500">{donorEmail}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {donorWallet ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-bold font-mono">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  Wallet: {donorWallet.slice(0, 6)}...{donorWallet.slice(-4)}
                </div>
              ) : (
                <button
                  onClick={handleLinkWallet}
                  disabled={linking}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all"
                >
                  {linking ? "Menghubungkan..." : "Kaitkan Wallet Crypto"}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all"
              >
                Keluar
              </button>
            </div>
          </div>

          {!donorWallet && (
            <p className="mt-4 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              💡 <strong>Tips:</strong> Kaitkan MetaMask Wallet Anda agar sistem dapat memindai dan menampilkan riwayat Donasi Crypto (On-chain) Anda secara otomatis.
            </p>
          )}
        </div>

        {/* Dashboard Content */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          
          {/* Tabs */}
          <div className="border-b border-gray-100 flex">
            <button
              onClick={() => setActiveTab("offchain")}
              className={`flex-1 py-4 text-sm font-extrabold transition-all border-b-2 text-center ${
                activeTab === "offchain"
                  ? "border-amber-400 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Donasi Rupiah (Off-chain)
            </button>
            <button
              onClick={() => setActiveTab("onchain")}
              className={`flex-1 py-4 text-sm font-extrabold transition-all border-b-2 text-center ${
                activeTab === "onchain"
                  ? "border-amber-400 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Donasi Crypto (On-chain)
            </button>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <p className="text-center text-sm text-red-500">{error}</p>
            ) : activeTab === "offchain" ? (
              // OFF-CHAIN TABLE
              donations.offchain.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm italic">Belum ada riwayat donasi transfer bank.</p>
                  <Link to="/pura" className="mt-4 inline-block text-xs font-bold text-amber-600 hover:underline">
                    Mulai Berdonasi →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-4">Kampanye</th>
                        <th className="pb-4">Nominal</th>
                        <th className="pb-4">Bank (VA)</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {donations.offchain.map((tx) => (
                        <tr key={tx.order_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-bold text-gray-900">
                            <Link to={`/campaign/${tx.campaign_id}`} className="hover:text-amber-600 transition-colors">
                              {tx.campaign_title}
                            </Link>
                          </td>
                          <td className="py-4 font-mono font-bold text-gray-800">
                            {formatRupiah(tx.gross_amount)}
                          </td>
                          <td className="py-4 uppercase text-gray-500 font-semibold">{tx.bank}</td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                tx.system_status === "PAID_LOCKED" || tx.system_status === "SETTLED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : tx.system_status === "PENDING_PAYMENT"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                            >
                              {tx.system_status === "PAID_LOCKED" ? "BERHASIL" : tx.system_status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-gray-400">
                            {new Date(tx.updated_at).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // ON-CHAIN TABLE
              !donorWallet ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm leading-relaxed">
                    Harap kaitkan wallet crypto Anda terlebih dahulu di atas untuk memindai riwayat donasi on-chain.
                  </p>
                </div>
              ) : donations.onchain.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm italic">Belum ada riwayat donasi crypto yang terdeteksi.</p>
                  <Link to="/pura" className="mt-4 inline-block text-xs font-bold text-amber-600 hover:underline">
                    Mulai Berdonasi →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-4">Kampanye</th>
                        <th className="pb-4">Jumlah</th>
                        <th className="pb-4">Token</th>
                        <th className="pb-4">Tanggal</th>
                        <th className="pb-4">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {donations.onchain.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-bold text-gray-900">
                            <Link to={`/campaign/${tx.campaign_id}`} className="hover:text-amber-600 transition-colors">
                              {tx.campaign_title}
                            </Link>
                          </td>
                          <td className="py-4 font-mono font-bold text-gray-800">
                            {parseFloat(tx.amount).toLocaleString("en-US", { maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-4 font-semibold text-indigo-600">USDT/USDC</td>
                          <td className="py-4 text-xs text-gray-400">
                            {new Date(tx.timestamp * 1000).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 font-mono text-xs text-indigo-500">
                            <a
                              href={`https://testnet.bscscan.com/tx/${tx.donor}`} // just a placeholder/tx address
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Detail Tx ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
