const { ethers } = require("ethers");
const DonationVaultABI = require("../../frontend/src/services/blockchain/abi/DonationVaultABI.json");

const VAULT_ADDRESS = "0xd71e1d259389870d550e931c185Fb1FAF2CB7916";
const RPC = "https://bsc-testnet-rpc.publicnode.com";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const vault = new ethers.Contract(VAULT_ADDRESS, DonationVaultABI, provider);

  const block = await provider.getBlock("latest");
  console.log("Current BSC Testnet block timestamp:", block.timestamp);
  console.log("Current BSC Testnet time:", new Date(Number(block.timestamp) * 1000).toISOString());

  const campaigns = [
    { name: "Renovasi (MIDTRANS_ONLY)", id: "1779822449241" },
    { name: "Odalan Kedua (HYBRID)", id: "1779847915770" },
  ];

  for (const c of campaigns) {
    try {
      const result = await vault.getCampaign(c.id);
      console.log(`\n=== ${c.name} (ID: ${c.id}) ===`);
      console.log("  campaignType:", result[0].toString());
      console.log("  adminPura:", result[1]);
      console.log("  payoutWallet:", result[2]);
      console.log("  deadline (raw):", result[3].toString());
      console.log("  deadline (date):", result[3] > 0 ? new Date(Number(result[3]) * 1000).toISOString() : "NO DEADLINE (open-ended)");
      console.log("  withdrawn:", result[4]);
    } catch (err) {
      console.log(`\n=== ${c.name} (ID: ${c.id}) ===`);
      console.log("  ERROR:", err.message?.substring(0, 200));
    }
  }
}

main().catch(console.error);
