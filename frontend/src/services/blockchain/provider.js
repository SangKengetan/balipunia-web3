// src/web3/provider.js
import { ethers } from "ethers";

export function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask tidak terdeteksi");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}
