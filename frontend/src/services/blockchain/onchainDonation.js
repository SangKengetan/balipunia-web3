import { ethers } from "ethers";
import DonationVaultABI from "./abi/DonationVaultABI.json";
import { DONATION_VAULT_ADDRESS } from "./constants";

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

export async function donateOnChain({ campaignId, token, amount }) {
  await ensureBscTestnet();

  const provider = getProvider();
  const signer = await provider.getSigner();

  const vault = new ethers.Contract(
    DONATION_VAULT_ADDRESS,
    DonationVaultABI,
    signer
  );

  const erc20 = new ethers.Contract(
    token,
    ["function approve(address,uint256) external returns (bool)"],
    signer
  );

  const parsedAmount = ethers.parseUnits(amount, 18);

  // approve
  const approveTx = await erc20.approve(
    DONATION_VAULT_ADDRESS,
    parsedAmount
  );
  await approveTx.wait();

  // donate
  const donateTx = await vault.donate(
    campaignId,
    token,
    parsedAmount
  );
  await donateTx.wait();

  return donateTx.hash;
}
