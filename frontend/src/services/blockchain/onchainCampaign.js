import { ethers } from "ethers";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS } from "./constants";

export const CAMPAIGN_TYPE = {
  SC_ONLY: 0,
  HYBRID: 1,
};

function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak ditemukan");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function ensureWalletConnected() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak ditemukan");
  }

  // 🔑 INI YANG MEMUNCULKAN POPUP
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("Tidak ada wallet yang terhubung");
  }

  return accounts[0];
}

export async function createCampaignOnChain({
  campaignId,
  campaignType,
  payoutWallet,
  deadlineUnix,
}) {
  if (!campaignId) throw new Error("campaignId wajib diisi");
  if (!payoutWallet) throw new Error("payoutWallet wajib diisi");
  if (!deadlineUnix) throw new Error("deadline wajib diisi");

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

  const provider = getProvider();
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
