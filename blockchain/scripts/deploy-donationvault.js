const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DonationVault with:", deployer.address);

  const DonationVault = await ethers.getContractFactory("DonationVaultV2");
  const vault = await DonationVault.deploy(
    process.env.USDT_ADDRESS,
    process.env.USDC_ADDRESS
  );

  await vault.deployed();
  console.log("DonationVault deployed at:", vault.address);
}

main().catch(console.error);
