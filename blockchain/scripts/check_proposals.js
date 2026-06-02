const { ethers } = require("ethers");
const VotingABI = require("../../frontend/src/services/blockchain/abi/VotingABI.json");

const VOTING_ADDRESS = "0x0FeBd6b4204073Fe0e1f388b9C23DbDB95e187d3";
const RPC = "https://bsc-testnet-rpc.publicnode.com";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const voting = new ethers.Contract(VOTING_ADDRESS, VotingABI, provider);

  // Check proposal count
  const count = await voting.proposalCount();
  console.log("Total proposals:", count.toString());

  // Check active proposal flags for both campaigns
  const campaignIds = ["1779822449241", "1779847915770"];
  for (const cid of campaignIds) {
    const hasActive = await voting.hasActiveProposalByCampaign(cid);
    console.log(`Campaign ${cid} hasActiveProposal:`, hasActive);
  }

  // Check each proposal
  for (let i = 1; i <= count; i++) {
    try {
      const p = await voting.getProposal(i);
      console.log(`\n=== Proposal ${i} ===`);
      console.log("  campaignId:", p.campaignId.toString());
      console.log("  adminPura:", p.adminPura);
      console.log("  yesVotes:", p.yesVotes);
      console.log("  noVotes:", p.noVotes);
      console.log("  votesCount:", p.votesCount);
      console.log("  status:", ["PENDING", "APPROVED", "REJECTED"][p.status]);
      console.log("  executed:", p.executed);
    } catch (err) {
      console.log(`Proposal ${i}: ERROR -`, err.message?.substring(0, 100));
    }
  }
}

main().catch(console.error);
