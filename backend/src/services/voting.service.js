// services/voting.service.js
const voting = require("../blockchain/voting.contract");
const { votingSigner } = require("../blockchain/signer");

/**
 * =========================
 * PROPOSE WITHDRAW
 * =========================
 */
async function proposeWithdraw(campaignId) {
  if (!voting) {
    throw new Error("VOTING_CONTRACT_UNDEFINED");
  }

  if (!votingSigner || !votingSigner.address) {
    throw new Error("SIGNER_NOT_INITIALIZED");
  }

  const contract = voting.connect(votingSigner);

  if (!contract.proposeWithdraw) {
    throw new Error("PROPOSE_WITHDRAW_NOT_FOUND_IN_ABI");
  }

  const tx = await contract.proposeWithdraw(campaignId);
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => {
      try {
        return voting.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "WithdrawProposed");

  if (!event) {
    throw new Error("WITHDRAW_PROPOSED_EVENT_NOT_FOUND");
  }

  return {
    txHash: receipt.hash,
    proposalId: event.args.proposalId.toString(),
    campaignId: event.args.campaignId.toString(),
  };
}

/**
 * =========================
 * VOTE
 * =========================
 */
async function voteProposal(proposalId, support) {
  const tx = await voting
    .connect(votingSigner)
    .vote(proposalId, support);

  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    proposalId: proposalId.toString(),
    support,
  };
}

/**
 * =========================
 * READ PROPOSAL STATUS
 * =========================
 */
async function getProposal(proposalId) {
  const [
    campaignId,
    yesVotes,
    noVotes,
    votesCount,
    status,
    executed,
  ] = await voting.getProposal(proposalId);

  const statusMap = {
    0: "PENDING",
    1: "APPROVED",
    2: "REJECTED",
  };

  return {
    proposalId: proposalId.toString(),
    campaignId: campaignId.toString(),
    yesVotes: Number(yesVotes),
    noVotes: Number(noVotes),
    votesCount: Number(votesCount),
    status: statusMap[Number(status)] ?? "UNKNOWN",
    executed,
  };
}

module.exports = {
  proposeWithdraw,
  voteProposal,
  getProposal,
};
