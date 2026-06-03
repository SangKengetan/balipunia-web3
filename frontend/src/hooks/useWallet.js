import { useState } from "react";
import { ethers } from "ethers";
import { showError } from "../utils/notification";

export default function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      showError("Dompet Digital Tidak Ditemukan", "MetaMask tidak terdeteksi di browser ini.", "Pastikan Anda telah memasang ekstensi browser MetaMask.");
      return null;
    }

    // 1️⃣ WAJIB: trigger popup MetaMask
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      return null;
    }

    // 2️⃣ Baru buat provider ethers
    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await ethProvider.getSigner();
    const walletAddress = await signer.getAddress();

    setProvider(ethProvider);
    setAddress(walletAddress);

    return walletAddress; // ⬅️ PENTING untuk flow login
  };

  return {
    address,
    provider,
    connectWallet,
  };
}
