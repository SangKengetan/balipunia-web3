const { ethers } = require("ethers");
const provider = require("./provider");
const DonationVaultABI = require("./abi/DonationVaultABI.json");

const DONATION_VAULT_ADDRESS =
  process.env.DONATION_VAULT_ADDRESS;

const donationVault = new ethers.Contract(
  DONATION_VAULT_ADDRESS,
  DonationVaultABI,
  provider
);

module.exports = donationVault;
