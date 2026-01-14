const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Governance with:", deployer.address);

  const Governance = await ethers.getContractFactory("Governance");

  const trustees = [
    process.env.TRUSTEE_1,
    process.env.TRUSTEE_2,
    process.env.TRUSTEE_3
  ];

  const governance = await Governance.deploy(
    process.env.DONATION_VAULT_ADDRESS, // ISI DENGAN VAULT BARU
    trustees
  );

  await governance.deployed();
  console.log("Governance deployed at:", governance.address);
}

main().catch(console.error);
