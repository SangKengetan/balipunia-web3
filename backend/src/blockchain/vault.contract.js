const { Contract } = require("ethers");
const provider = require("./provider");
const vaultAbi = require("./abi/DonationVaultABI.json");

const vaultContract = new Contract(
  process.env.DONATION_VAULT_ADDRESS,
  vaultAbi,
  provider // READ ONLY
);

module.exports = vaultContract;
