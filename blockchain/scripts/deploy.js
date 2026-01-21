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

  // OPTIONAL: admin pura awal (bisa deployer dulu)
  const INITIAL_ADMIN_PURA = "0xC90e153198B209507E20ED3eEea8CE2120D9Bb92";

  // ===== DEPLOY VAULT =====
  const Vault = await hre.ethers.getContractFactory("DonationVaultV5");
  const vault = await Vault.deploy(USDT, USDC);
  await vault.deployed();

  const vaultAddress = vault.address;
  console.log("✅ DonationVaultV5 deployed:", vaultAddress);

  // ===== DEPLOY VOTING =====
  const Voting = await hre.ethers.getContractFactory("VotingV2");
  const voting = await Voting.deploy(vaultAddress, TRUSTEES);
  await voting.deployed();

  const votingAddress = voting.address;
  console.log("✅ VotingV2 deployed:", votingAddress);

  // ===== SET VOTING =====
  const txSetVoting = await vault.setVoting(votingAddress);
  await txSetVoting.wait();
  console.log("🔐 Voting address set in Vault");

  // ===== SET INITIAL ADMIN PURA =====
  const txAdmin = await vault.addAdminPura(INITIAL_ADMIN_PURA);
  await txAdmin.wait();
  console.log("🏛️ Initial Admin Pura set:", INITIAL_ADMIN_PURA);

  console.log("\n🎉 DEPLOYMENT COMPLETE");
  console.log("Super Admin :", deployer.address);
  console.log("Admin Pura  :", INITIAL_ADMIN_PURA);
  console.log("Trustees    :", TRUSTEES.join(", "));
  console.log("Vault       :", vaultAddress);
  console.log("Voting      :", votingAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
