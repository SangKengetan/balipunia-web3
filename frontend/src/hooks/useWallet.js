import { useState } from "react";
import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { showError } from "../utils/notification";

const projectId = "63eefcbe5a9ac605c0e402cdc619fa0b"; // WalletConnect Project ID

export default function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      let walletProvider;

      // 1️⃣ Cek apakah harus pakai WalletConnect (jika di HP atau jika tidak ada window.ethereum)
      if (!window.ethereum || isMobile) {
        // Inisialisasi WalletConnect Provider
        const wcProvider = await EthereumProvider.init({
          projectId, 
          metadata: {
            name: "BaliPunia",
            description: "Platform Manajemen Pura dan Donasi",
            url: window.location.origin, 
            icons: [`${window.location.origin}/logo.png`],
          },
          showQrModal: true,
          optionalChains: [97], // BSC Testnet
        });

        // Trigger koneksi via WalletConnect
        await wcProvider.connect();
        walletProvider = wcProvider;
      } else {
        // 2️⃣ Jika di PC dan ada MetaMask extension, gunakan window.ethereum
        walletProvider = window.ethereum;
        await walletProvider.request({ method: "eth_requestAccounts" });
      }

      if (!walletProvider) {
         return null;
      }

      // 3️⃣ Buat provider ethers menggunakan walletProvider yang didapat (MetaMask atau WalletConnect)
      const ethProvider = new ethers.BrowserProvider(walletProvider);
      const signer = await ethProvider.getSigner();
      const walletAddress = await signer.getAddress();

      setProvider(ethProvider);
      setAddress(walletAddress);

      return walletAddress;

    } catch (error) {
      console.error("Gagal terhubung ke wallet:", error);
      showError("Koneksi Gagal", "Tidak dapat terhubung ke dompet digital Anda.", error.message);
      return null;
    }
  };

  return {
    address,
    provider,
    connectWallet,
  };
}
