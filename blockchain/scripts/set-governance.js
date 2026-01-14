const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const donationVaultAddress = process.env.DONATION_VAULT_ADDRESS;
  const governanceAddress = process.env.GOVERNANCE_ADDRESS;

  const DonationVault = await ethers.getContractFactory("DonationVaultV2");
  const donationVault = DonationVault.attach(donationVaultAddress);

  const tx = await donationVault.setGovernance(governanceAddress);
  await tx.wait();

  console.log("Governance set to:", governanceAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
