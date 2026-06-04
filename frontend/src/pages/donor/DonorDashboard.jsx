import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useDonorAuth from "../../hooks/useDonorAuth";
import useWallet from "../../hooks/useWallet";
import Navbar from "../../components/Navbar";
import { showError, showSuccess } from "../../utils/notification";

export default function DonorDashboard() {
  const navigate = useNavigate();
  const { 
    donorToken, 
    donorEmail, 
    donorName, 
    donorWallets, 
    logoutDonor, 
    addWalletAddress,
    removeWalletAddress
  } = useDonorAuth();

  const { address, connectWallet } = useWallet();

  const [donations, setDonations] = useState({ offchain: [], onchain: [] });
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [activeTab, setActiveTab] = useState("offchain");
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/my-donations`, {
        headers: {
          Authorization: `Bearer ${donorToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil riwayat donasi");
      }

      const data = await res.json();
      setDonations(data);

      // Fetch Rank
      const resRank = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/donor/rank`, {
        headers: {
          Authorization: `Bearer ${donorToken}`,
        },
      });
      if (resRank.ok) {
        const rankData = await resRank.json();
        setRank(rankData.data);
      }
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
  }, [donorToken, donorWallets.length]); // Dependency on wallets length to refetch history when linked/unlinked

  const handleLinkWallet = async () => {
    if (donorWallets.length >= 5) {
      showError("Batas Maksimal", "Anda hanya dapat mengaitkan maksimal 5 wallet per akun.");
      return;
    }

    try {
      setLinking(true);
      const walletAddr = await connectWallet();
      if (!walletAddr) {
        showError("Gagal Terhubung", "Gagal menghubungkan Dompet Digital (Wallet).", "Silakan periksa koneksi internet Anda atau coba muat ulang halaman.");
        return;
      }

      if (donorWallets.some(w => w.toLowerCase() === walletAddr.toLowerCase())) {
        showError("Wallet Terdaftar", "Wallet ini sudah dikaitkan ke akun Anda.");
        return;
      }

      // Save to backend
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${donorToken}`,
        },
        body: JSON.stringify({ wallet_address: walletAddr }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Gagal menyimpan wallet address ke akun");
      }

      addWalletAddress(walletAddr);
      showSuccess("Berhasil", "Dompet Digital (Wallet) berhasil dikaitkan ke akun donatur Anda!");
    } catch (err) {
      showError("Gagal Mengaitkan", err.message || "Gagal mengaitkan wallet.", "Silakan coba beberapa saat lagi.");
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveWallet = async (walletToRemove) => {
    if (!window.confirm(`Hapus kaitan wallet ${walletToRemove.slice(0,6)}...${walletToRemove.slice(-4)}?`)) return;

    try {
      setRemoving(walletToRemove);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/wallet/${walletToRemove}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${donorToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus wallet dari akun");
      }

      removeWalletAddress(walletToRemove);
      showSuccess("Berhasil", "Wallet berhasil dihapus.");
    } catch (err) {
      showError("Gagal Menghapus", err.message);
    } finally {
      setRemoving(null);
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
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
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
            
            <button
              onClick={handleLogout}
              className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all inline-block"
            >
              Keluar Akun
            </button>

            {rank && (
              <div className="mt-6 flex gap-4">
                <div className="bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-yellow-600 mb-0.5">Rank Rupiah</p>
                  <p className="text-xl font-black text-yellow-700">#{rank.offchain?.rank || "-"}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-indigo-600 mb-0.5">Rank Kripto</p>
                  <p className="text-xl font-black text-indigo-700">#{rank.onchain?.rank || "-"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="md:max-w-[400px] w-full bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">Wallet Tersimpan</h3>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                {donorWallets.length} / 5
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {donorWallets.map((wallet, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </div>
                  <button 
                    onClick={() => handleRemoveWallet(wallet)}
                    disabled={removing === wallet}
                    className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {removing === wallet ? "..." : "Hapus"}
                  </button>
                </div>
              ))}
              
              {donorWallets.length === 0 && (
                <p className="text-xs text-gray-400 italic">Belum ada wallet yang dikaitkan.</p>
              )}
            </div>

            <button
              onClick={handleLinkWallet}
              disabled={linking || donorWallets.length >= 5}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {linking ? "Menghubungkan..." : "Kaitkan Wallet Baru"}
            </button>
            {donorWallets.length === 0 && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 leading-snug">
                💡 <strong>Tips:</strong> Kaitkan MetaMask Anda agar sistem dapat memindai donasi On-chain.
              </p>
            )}
          </div>
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
              Donasi Kripto (Aset Digital)
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
                          <td className="py-4">
                            <div className="font-semibold uppercase text-gray-800">{tx.bank}</div>
                            {tx.raw_response?.va_numbers?.[0]?.va_number && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                  {tx.raw_response.va_numbers[0].va_number}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(tx.raw_response.va_numbers[0].va_number);
                                    alert("VA disalin!");
                                  }}
                                  className="text-xs text-gray-400 hover:text-amber-600"
                                  title="Salin VA"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                                tx.system_status === "PAID_LOCKED" || tx.system_status === "SETTLED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : tx.system_status === "PENDING_PAYMENT"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}
                            >
                              {tx.system_status === "PAID_LOCKED" || tx.system_status === "SETTLED"
                                ? "BERHASIL"
                                : tx.system_status === "PENDING_PAYMENT"
                                ? "MENUNGGU PEMBAYARAN"
                                : tx.system_status === "EXPIRED"
                                ? "KEDALUWARSA"
                                : tx.system_status === "FAILED"
                                ? "GAGAL"
                                : tx.system_status}
                            </span>
                            {tx.system_status === "PENDING_PAYMENT" && tx.raw_response?.expiry_time && (
                              <div className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Exp: {new Date(tx.raw_response.expiry_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
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
              donorWallets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm leading-relaxed">
                    Harap kaitkan wallet crypto Anda terlebih dahulu di atas untuk memindai riwayat donasi on-chain.
                  </p>
                </div>
              ) : donations.onchain.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm italic">Belum ada riwayat donasi crypto yang terdeteksi pada wallet Anda.</p>
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
                        <th className="pb-4">Wallet Pengirim</th>
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
                          <td className="py-4 font-mono text-xs text-gray-500">
                            {tx.donor.slice(0, 6)}...{tx.donor.slice(-4)}
                          </td>
                          <td className="py-4 text-xs text-gray-400">
                            {new Date(tx.timestamp * 1000).toLocaleString("id-ID")}
                          </td>
                          <td className="py-4 font-mono text-xs text-indigo-500">
                            <a
                              href={`https://testnet.bscscan.com/tx/${tx.donor}`} // Placeholdr tx url 
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
