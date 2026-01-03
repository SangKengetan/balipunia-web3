const hre = require("hardhat");

async function main() {
  const DonationVault = await hre.ethers.getContractFactory("DonationVault");

  const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
  const USDC = "0x64544969ed7EBf5f083679233325356EbE738930";

  console.log("Deploying DonationVault...");
  const vault = await DonationVault.deploy(USDT, USDC);

  await vault.deployed();

  console.log("DonationVault deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
