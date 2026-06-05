import { ethers } from "ethers";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { VOTING_ADDRESS } from "./constants";
import VotingABI from "./abi/VotingABI.json";

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

export const registerTrustees = async (trustees) => {
  if (trustees.length !== 3) {
    throw new Error("Harus mendaftarkan tepat 3 trustee");
  }

  const provider = await getProvider();
  
  // Memastikan provider terhubung (bisa berupa metamask atau walletconnect)
  const signer = await provider.getSigner();

  const votingContract = new ethers.Contract(VOTING_ADDRESS, VotingABI, signer);

  // Memanggil setTrustees(address[3])
  const tx = await votingContract.setTrustees(trustees);
  console.log("Tx Hash:", tx.hash);

  // Menunggu transaksi selesai
  const receipt = await tx.wait();
  return receipt;
};
