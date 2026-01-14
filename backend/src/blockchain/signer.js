const { ethers } = require("ethers");
const provider = require("./provider");
const {Wallet} = require("ethers");

// 1. SIGNER KHUSUS OWNER/DEPLOYER (0xF075...)
// Wajib dipakai untuk: registerScCampaign
const ownerSigner = new ethers.Wallet(
  process.env.SUPER_ADMIN_PRIVATE_KEY, 
  provider
);
if (!process.env.SUPER_ADMIN_PRIVATE_KEY) {
  throw new Error("SUPER_ADMIN_PRIVATE_KEY is missing");
}

// 2. SIGNER KHUSUS VOTING/TRUSTEE (0x8598...)
// Wajib dipakai untuk: withdraw
const votingSigner = new Wallet(
  process.env.SUPER_ADMIN_PRIVATE_KEY, 
  provider
);

console.log("🔹 Signer Loaded:");
console.log("   - Owner Address :", ownerSigner.address);
console.log("   - Voting Address:", votingSigner.address);

module.exports = {
  ownerSigner,
  votingSigner,
};