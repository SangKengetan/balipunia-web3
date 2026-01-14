const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying with:", deployer.address);

  // ===== CONFIG =====
  const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
  const USDC = "0x64544969ed7EBf5f083679233325356EbE738930";

  const TRUSTEES = [
    "0x8598A45E40e558762B24679ee9b65F143854Daf0",
    "0x5A603CB39B31BCf9614ce8D090F685A201043ffa",
    "0x844E109DefeBe587F1f6e07923AE022442e58FDF",
  ];

  // ===== DEPLOY VAULT =====
  const Vault = await hre.ethers.getContractFactory("DonationVaultV3");
  const vault = await Vault.deploy(USDT, USDC);
  await vault.deployed();

  // FIX 1: Use .address instead of .getAddress()
  const vaultAddress = vault.address; 
  console.log("✅ DonationVaultV3 deployed:", vaultAddress);

  // ===== DEPLOY VOTING =====
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(vaultAddress, TRUSTEES);
  await voting.deployed();

  // FIX 2: Use .address here as well
  const votingAddress = voting.address;
  console.log("✅ Voting deployed:", votingAddress);

  // ===== SET VOTING =====
  const tx = await vault.setVoting(votingAddress);
  await tx.wait();

  console.log("🔐 Voting address set in Vault");

  console.log("\n🎉 DEPLOYMENT COMPLETE");
  console.log("Vault  :", vaultAddress);
  console.log("Voting :", votingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});