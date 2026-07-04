import { useState } from "react";
import { donateOnChain } from "../services/blockchain/onchainDonation";
import useDonorAuth from "../hooks/useDonorAuth";
import { showError, showSuccess, showInfo } from "../utils/notification";

export default function OnchainDonateBox({ onchainCampaignId, onDonateSuccess }) {
  const { donorToken, donorWallets, addWalletAddress } = useDonorAuth();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDT");
  const [loading, setLoading] = useState(false);

  async function handleDonate() {
    // Validasi dasar di UI (Minimal 1)
    if (!amount || parseFloat(amount) < 1) {
      showInfo("Minimal Punia", "Silakan masukkan minimal punia 1 USDT/USDC.");
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
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts[0]) {
            const walletAddr = accounts[0];
            
            // Check if not already linked and under limit
            if (donorToken && (!donorWallets || !donorWallets.some(w => w.toLowerCase() === walletAddr.toLowerCase()))) {
              if (donorWallets.length < 5) {
                await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/wallet`, {
                  method: "POST", // was PUT, now POST
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${donorToken}`,
                  },
                  body: JSON.stringify({ wallet_address: walletAddr }),
                });
                addWalletAddress(walletAddr);
              }
            }
          }
        } catch (linkErr) {
          console.error("Gagal menautkan wallet secara otomatis:", linkErr);
        }
      }

      if (onDonateSuccess) onDonateSuccess();
      showSuccess("Matur Suksma!", "Punia Anda berhasil dikirim.\nHash: " + txHash);
      setAmount("");
    } catch (err) {
      console.error(err);
      // Menampilkan pesan error yang lebih user-friendly (termasuk saldo kurang)
      showError("Transaksi Gagal", err?.reason || err?.message || "Terjadi kesalahan pada transaksi", "Pastikan saldo Kripto Anda cukup dan Anda menyetujui transaksi di Dompet Digital (Wallet).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3">Punia Kripto</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nominal Kripto <span className="text-red-500">*</span>
            </label>
            <div className="flex rounded-lg shadow-sm border border-gray-300 overflow-hidden focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500 transition-colors">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Minimal 1.00"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if ((val.match(/\./g) || []).length <= 1) {
                    setAmount(val);
                  }
                }}
                className="flex-1 w-full px-4 py-2.5 outline-none text-lg font-medium bg-white"
              />
              <div className="bg-gray-50 border-l border-gray-300 flex items-center px-2">
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-gray-700 cursor-pointer text-sm"
                >
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>
            {amount !== "" && parseFloat(amount) < 1 && (
              <p className="mt-1 text-sm text-red-500">⚠️ Minimal punia adalah 1 USDT/USDC</p>
            )}
          </div>

          <button
            onClick={handleDonate}
            disabled={loading || !amount}
            className="w-full py-3 bg-[#FBBF24] hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? "Memproses..." : "Kirim Punia"}
          </button>
        </div>

        <div className="mt-5 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 leading-relaxed">
          Punia akan dikirim secara otomatis ke smart contract. Pastikan Anda memiliki saldo BNB untuk biaya jaringan BSC(gas fee).
        </div>
      </div>
    </div>
  );
}