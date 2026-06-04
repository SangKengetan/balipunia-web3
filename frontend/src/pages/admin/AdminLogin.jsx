import { useNavigate } from "react-router-dom";
import useWallet from "../../hooks/useWallet";
import useAdminAuth from "../../hooks/useAdminAuth";
import { requestNonce, verifySignature } from "../../services/authApi";
import { ethers } from "ethers";
import { getProvider } from "../../services/blockchain/provider";
import { showError } from "../../utils/notification";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { address, connectWallet } = useWallet();
  const { loginAdmin } = useAdminAuth();

  const handleAdminLogin = async () => {
    try {
      // 1️⃣ Connect wallet (MetaMask popup)
      const walletAddress = address || (await connectWallet());
      if (!walletAddress) {
        showError("Akses Ditolak", "Dompet Digital (Wallet) diperlukan untuk login admin.", "Pastikan Anda menghubungkan wallet MetaMask atau dompet lain yang didukung.");
        return;
      }

      // 2️⃣ Request nonce dari backend
      const { nonce } = await requestNonce(walletAddress);

      // 3️⃣ Sign message (nonce)
      const ethProvider = await getProvider();
      const signer = await ethProvider.getSigner();
      const message = `Login admin punia: ${nonce}`;
      const signature = await signer.signMessage(message);

      // 4️⃣ Verify signature ke backend
      const res = await verifySignature(walletAddress, signature);
      localStorage.setItem("token", res.token);

      // 5️⃣ Simpan session admin
      loginAdmin({
        token: res.token,
        role: res.role,
        address: res.address,
      });

      // 6️⃣ Redirect ke dashboard
      
      navigate("/admin");
    } catch (err) {
      console.error(err);
      showError(
        "Gagal Autentikasi", 
        err.message || "Gagal autentikasi admin. Pastikan wallet terdaftar.",
        "Silakan periksa kembali apakah dompet (wallet) Anda telah didaftarkan sebagai Admin."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Admin Login
        </h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          Halaman ini hanya dapat diakses oleh Super Admin, Admin Pura,
          dan Trustees dengan wallet terdaftar.
        </p>

        <button
          onClick={handleAdminLogin}
          className="
            w-full
            bg-(--punia-yellow)
            text-black
            font-semibold
            py-3
            rounded-full
          "
        >
          Hubungkan Wallet & Masuk
        </button>
      </div>
    </div>
  );
}
