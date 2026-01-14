const hre = require("hardhat");

async function main() {
  const Anchor = await hre.ethers.getContractFactory("FinancialReportAnchor");
  const anchor = await Anchor.deploy();
  await anchor.deployed();

  console.log("FinancialReportAnchor deployed at:", anchor.address);
}

main().catch(console.error);
