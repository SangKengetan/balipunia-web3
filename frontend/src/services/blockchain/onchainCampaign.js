import { ethers } from "ethers";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS } from "./constants";

/**
 * Enum CampaignType sesuai DonationVault.sol
 * HYBRID        = 0  → Fiat + Crypto
 * MIDTRANS_ONLY = 1  → Fiat only (crypto diblokir di kontrak)
 * CRYPTO_ONLY   = 2  → Crypto only
 */
export const CAMPAIGN_TYPE = {
  HYBRID: 0,
  MIDTRANS_ONLY: 1,
  CRYPTO_ONLY: 2,
};

import { EthereumProvider } from "@walletconnect/ethereum-provider";

const projectId = "63eefcbe5a9ac605c0e402cdc619fa0b";

async function getProvider() {
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
      optionalChains: [1, 97],
      rpcMap: {
        97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        1: "https://eth.llamarpc.com",
      },
    });
  } else {
    walletProvider = window.ethereum;
  }

  if (!walletProvider) {
    throw new Error("MetaMask atau WalletConnect tidak ditemukan");
  }
  return new ethers.BrowserProvider(walletProvider);
}

async function ensureWalletConnected() {
  const provider = await getProvider();
  
  // 🔑 Memunculkan popup MetaMask / WalletConnect
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  if (!address) {
    throw new Error("Tidak ada wallet yang terhubung");
  }

  return address;
}

/**
 * Registrasi kegiatan ke smart contract DonationVault.
 * Semua tipe (HYBRID, MIDTRANS_ONLY, CRYPTO_ONLY) harus melewati fungsi ini.
 * 
 * @param {Object} params
 * @param {number} params.campaignId - ID unik kegiatan
 * @param {number} params.campaignType - Enum CampaignType (0, 1, atau 2)
 * @param {string} params.payoutWallet - Alamat wallet admin pura
 * @param {number} params.deadlineUnix - Unix timestamp deadline (0 = open-ended)
 */
export async function createCampaignOnChain({
  campaignId,
  campaignType,
  payoutWallet,
  deadlineUnix,
}) {
  if (!campaignId) throw new Error("campaignId wajib diisi");
  if (!payoutWallet) throw new Error("payoutWallet wajib diisi");
  // deadline = 0 berarti open-ended, jadi TIDAK perlu validasi !deadlineUnix

  // 🔥 WAJIB: trigger MetaMask popup
  const connectedWallet = await ensureWalletConnected();

  console.log("CONNECTED WALLET (MetaMask):", connectedWallet);
  console.log("ADMIN WALLET (Session):", payoutWallet);

  if (
    connectedWallet.toLowerCase() !== payoutWallet.toLowerCase()
  ) {
    throw new Error(
      "Wallet MetaMask tidak sesuai dengan wallet admin pura yang login"
    );
  }

  const provider = await getProvider();
  const signer = await provider.getSigner();

  const vault = new ethers.Contract(
    DONATION_VAULT_ADDRESS,
    DonationVaultABI,
    signer
  );

  // 🔗 CALL SMART CONTRACT
  const tx = await vault.createCampaign(
    campaignId,
    campaignType,
    payoutWallet,
    deadlineUnix
  );

  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    campaignId,
  };
}
