import { ethers } from "ethers";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS, TOKENS } from "./constants";

export const CAMPAIGN_TYPE = {
  HYBRID: 1,
  "SC-ONLY": 0,
};


function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak ditemukan");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function ensureBscTestnet() {
  const provider = getProvider();
  const network = await provider.getNetwork();

  if (network.chainId !== 97n) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x61" }],
    });
  }
}

export async function donateOnChain({
  campaignId,
  campaignType, // ⬅️ BARU
  tokenKey,
  amount,
}) {
  await ensureBscTestnet();

  const provider = getProvider();
  const signer = await provider.getSigner();

  const token = TOKENS[tokenKey];
  if (!token) throw new Error("Token tidak valid");

  const vault = new ethers.Contract(
    DONATION_VAULT_ADDRESS,
    DonationVaultABI,
    signer
  );

  const erc20 = new ethers.Contract(
    token.address,
    [
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) external view returns (uint256)",
    ],
    signer
  );

  const parsedAmount = ethers.parseUnits(amount, token.decimals);

  const owner = await signer.getAddress();
  const allowance = await erc20.allowance(
    owner,
    DONATION_VAULT_ADDRESS
  );

  if (allowance < parsedAmount) {
    const approveTx = await erc20.approve(
      DONATION_VAULT_ADDRESS,
      parsedAmount
    );
    await approveTx.wait();
  }

  // ✅ URUTAN SESUAI SC
  const donateTx = await vault.donate(
    campaignId,
    campaignType,      // ⬅️ WAJIB
    token.address,
    parsedAmount
  );
  console.log("donateTx:", donateTx);

  // ethers v6 defensive handling
  if (!donateTx) {
    throw new Error("Transaksi tidak terbentuk (ABI mismatch)");
  }

  // Jika tx punya wait()
  if (typeof donateTx.wait === "function") {
    const receipt = await donateTx.wait();
    return receipt.hash;
  }

  // fallback (sangat jarang, tapi aman)
  if (donateTx.hash) {
    return donateTx.hash;
  }

  throw new Error("Gagal mendapatkan hash transaksi");
  
}
