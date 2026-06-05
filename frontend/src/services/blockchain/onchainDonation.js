import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS, TOKENS } from "./constants";

const projectId = "63eefcbe5a9ac605c0e402cdc619fa0b";

async function getProvider() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  let walletProvider;

  if (!window.ethereum || isMobile) {
    walletProvider = await EthereumProvider.init({
      projectId, 
      metadata: {
        name: "BaliPunia",
        description: "Platform Manajemen Pura dan Punia",
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

async function ensureBscTestnet() {
  const provider = await getProvider();
  const network = await provider.getNetwork();
  if (network.chainId !== 97n) {
    await provider.send("wallet_switchEthereumChain", [{ chainId: "0x61" }]);
  }
}

export async function donateOnChain({ campaignId, tokenKey, amount }) {
  await ensureBscTestnet();

  const provider = await getProvider();
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