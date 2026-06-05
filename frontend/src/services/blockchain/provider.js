// src/web3/provider.js
import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

const projectId = "63eefcbe5a9ac605c0e402cdc619fa0b";

export async function getProvider() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  let walletProvider;

  if (!window.ethereum || isMobile) {
    walletProvider = await EthereumProvider.init({
      projectId,
      metadata: {
        name: "BaliPunia",
        description: "Platform Manajemen Pura dan Donasi",
        url: window.location.origin,
        icons: [`${window.location.origin}/logo.png`],
      },
      showQrModal: true,
      chains: [97],
      rpcMap: {
        97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      },
    });
  } else {
    walletProvider = window.ethereum;
  }

  if (!walletProvider) throw new Error("Dompet digital tidak ditemukan");
  return new ethers.BrowserProvider(walletProvider);
}

export async function getSigner() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}
