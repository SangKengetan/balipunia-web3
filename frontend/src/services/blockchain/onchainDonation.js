import { ethers } from "ethers";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS, TOKENS } from "./constants";

function getProvider() {
  if (!window.ethereum) throw new Error("MetaMask tidak ditemukan");
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

export async function donateOnChain({ campaignId, tokenKey, amount }) {
  await ensureBscTestnet();

  const provider = getProvider();
  const signer = await provider.getSigner();
  const owner = await signer.getAddress();
  const token = TOKENS[tokenKey];

  if (!token) throw new Error("Token tidak valid");

  // 1. Inisialisasi Kontrak
  const vault = new ethers.Contract(DONATION_VAULT_ADDRESS, DonationVaultABI, signer);
  const erc20 = new ethers.Contract(
    token.address,
    [
      "function approve(address,uint256) external returns (bool)",
      "function allowance(address,address) external view returns (uint256)",
      "function balanceOf(address) external view returns (uint256)", // Tambahkan ini
    ],
    signer
  );

  // 2. Konversi ke 18 desimal (BigInt)
  const parsedAmount = ethers.parseUnits(amount, token.decimals);

  // 3. CEK SALDO (Pencegahan error "exceeds balance")
  const userBalance = await erc20.balanceOf(owner);
  if (userBalance < parsedAmount) {
    throw new Error(`Saldo ${tokenKey} tidak mencukupi. Saldo Anda: ${ethers.formatUnits(userBalance, token.decimals)}`);
  }

  // 4. CEK ALLOWANCE & APPROVE
  const allowance = await erc20.allowance(owner, DONATION_VAULT_ADDRESS);
  if (allowance < parsedAmount) {
    // Gunakan notifikasi UI di sini jika perlu, karena approve butuh tanda tangan terpisah
    const approveTx = await erc20.approve(DONATION_VAULT_ADDRESS, parsedAmount);
    await approveTx.wait();
  }

  // 5. EKSEKUSI DONASI
  const donateTx = await vault.donate(
    BigInt(campaignId),
    token.address,
    parsedAmount
  );

  const receipt = await donateTx.wait();
  return receipt.hash;
}