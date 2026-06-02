const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying with:", deployer.address);

  // ===== CONFIG =====
  const USDT = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
  const USDC = "0x64544969ed7EBf5f083679233325356EbE738930";

  // Address untuk menampung fee/hasil withdrawal crypto
  // Sementara diarahkan ke deployer, bisa diganti nanti
  const SUPER_ADMIN_TREASURY = deployer.address; 

  const TRUSTEES = [
    "0x8598A45E40e558762B24679ee9b65F143854Daf0",
    "0x5A603CB39B31BCf9614ce8D090F685A201043ffa",
    "0x844E109DefeBe587F1f6e07923AE022442e58FDF",
  ];

  // OPTIONAL: admin pura awal (bisa deployer dulu)
  const INITIAL_ADMIN_PURA = "0xC90e153198B209507E20ED3eEea8CE2120D9Bb92";

  // ===== DEPLOY VAULT =====
  // Menggunakan DonationVault terbaru
  const Vault = await hre.ethers.getContractFactory("DonationVault");
  // Vault baru butuh 3 parameter: USDT, USDC, SUPER_ADMIN_TREASURY
  const vault = await Vault.deploy(USDT, USDC, SUPER_ADMIN_TREASURY);
  await vault.deployed();

  const vaultAddress = vault.address;
  console.log("✅ DonationVault deployed:", vaultAddress);

  // ===== DEPLOY VOTING =====
  // Menggunakan VotingGovernance (berasal dari VotingV3.sol)
  const Voting = await hre.ethers.getContractFactory("VotingGovernance");
  // Voting baru hanya butuh 1 parameter: alamat vault
  const voting = await Voting.deploy(vaultAddress);
  await voting.deployed();

  const votingAddress = voting.address;
  console.log("✅ VotingGovernance deployed:", votingAddress);

  // ===== SET VOTING =====
  const txSetVoting = await vault.setVoting(votingAddress);
  await txSetVoting.wait();
  console.log("🔐 Voting address set in Vault");

  // ===== SET INITIAL ADMIN PURA =====
  const txAdmin = await vault.addAdminPura(INITIAL_ADMIN_PURA);
  await txAdmin.wait();
  console.log("🏛️ Initial Admin Pura set:", INITIAL_ADMIN_PURA);

  console.log("\n🎉 DEPLOYMENT COMPLETE");
  console.log("Super Admin          :", deployer.address);
  console.log("Super Admin Treasury :", SUPER_ADMIN_TREASURY);
  console.log("Admin Pura           :", INITIAL_ADMIN_PURA);
  console.log("Vault                :", vaultAddress);
  console.log("VotingGovernance     :", votingAddress);
  
  console.log("\n⚠️ PENTING: Trustee tidak di-set secara otomatis pada deployment ini.");
  console.log(`Admin Pura (${INITIAL_ADMIN_PURA}) harus memanggil fungsi setTrustees() pada VotingGovernance untuk mendaftarkan 3 Trustee.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
