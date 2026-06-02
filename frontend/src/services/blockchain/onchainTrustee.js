import { ethers } from "ethers";
import { VOTING_ADDRESS } from "./constants";
import VotingABI from "./abi/VotingABI.json";

const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("Metamask tidak ditemukan");
  }
  return new ethers.BrowserProvider(window.ethereum);
};

export const registerTrustees = async (trustees) => {
  if (trustees.length !== 3) {
    throw new Error("Harus mendaftarkan tepat 3 trustee");
  }

  const provider = getProvider();
  
  // Memastikan metamask terhubung
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const signer = await provider.getSigner();

  const votingContract = new ethers.Contract(VOTING_ADDRESS, VotingABI, signer);

  // Memanggil setTrustees(address[3])
  const tx = await votingContract.setTrustees(trustees);
  console.log("Tx Hash:", tx.hash);

  // Menunggu transaksi selesai
  const receipt = await tx.wait();
  return receipt;
};
