import { useState } from "react";
import { donateOnChain } from "../services/blockchain/onchainDonation";
import useDonorAuth from "../hooks/useDonorAuth";

export default function OnchainDonateBox({ onchainCampaignId }) {
  const { donorToken, donorWallet, updateWalletAddress } = useDonorAuth();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    // Validasi dasar di UI
    if (!amount || parseFloat(amount) <= 0) {
      alert("Masukkan jumlah donasi yang valid");
      return;
    }
    
    try {
      setLoading(true);
      // Kirim string 'amount' apa adanya, biar service yang urus 18 desimalnya
      const txHash = await donateOnChain({
        campaignId: onchainCampaignId,
        tokenKey: token,
        amount: amount, 
      });

      // Automatically link wallet to donor account if not done yet
      if (!donorWallet && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts[0]) {
            const walletAddr = accounts[0];
            await fetch(\`${import.meta.env.VITE_API_BASE_URL}/auth/donor/wallet\`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${donorToken}`,
              },
              body: JSON.stringify({ wallet_address: walletAddr }),
            });
            updateWalletAddress(walletAddr);
          }
        } catch (linkErr) {
          console.error("Gagal menautkan wallet secara otomatis:", linkErr);
        }
      }

      alert("Matur Suksma! Donasi berhasil.\nHash: " + txHash);
      setAmount("");
    } catch (err) {
      console.error(err);
      // Menampilkan pesan error yang lebih user-friendly (termasuk saldo kurang)
      alert(err?.reason || err?.message || "Terjadi kesalahan pada transaksi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      {/* Visual Top Bar */}
      <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500" />
      
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-50 rounded-2xl text-yellow-600 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-xl tracking-tight">Donasi On-Chain</h3>
            <p className="text-sm text-gray-400 font-medium">Transparan via BSC Testnet</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Jumlah Punia</label>
                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">18 Decimals</span>
            </div>
            
            <div className="relative group">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent group-focus-within:border-yellow-400 group-focus-within:bg-white p-4 pt-5 pb-5 text-2xl font-black text-gray-900 rounded-2xl transition-all outline-none placeholder-gray-300"
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white border border-gray-200 text-sm font-bold text-gray-700 py-2 px-3 rounded-xl shadow-sm focus:ring-2 focus:ring-yellow-100 outline-none cursor-pointer"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleDonate}
            disabled={loading || !amount}
            className="w-full py-4 mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black rounded-2xl shadow-lg shadow-yellow-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:shadow-none flex justify-center items-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Salurkan Punia</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-gray-400 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium">
            Dana akan dikirim langsung ke <span className="text-gray-800 font-bold">Donation Vault</span>. Pastikan saldo BSC Testnet Anda cukup untuk gas fee.
          </p>
        </div>
      </div>
    </div>
  );
}