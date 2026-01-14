// services/voting.service.js
const voting = require("../blockchain/voting.contract");
const { votingSigner } = require("../blockchain/signer");

/**
 * =========================
 * PROPOSE WITHDRAW
 * =========================
 */

async function proposeWithdraw(campaignId, adminPuraWallet) {
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

    const tx = await contract.proposeWithdraw(
      campaignId,
      adminPuraWallet
    );

    if (!tx || !tx.wait) {
      throw new Error("TX_OBJECT_INVALID");
    }
  const receipt = await tx.wait();

  // ambil proposalId dari event
  const event = receipt.logs
    .map((log) => {
      try {
        return voting.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "WithdrawProposed");

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
    proposalId,
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
    adminPuraWallet,
    yesVotes,
    noVotes,
    votesCount,
    finalized,
    executed,
  ] = await voting.getProposal(proposalId);

  return {
    proposalId,
    campaignId: campaignId.toString(),
    adminPuraWallet,
    yesVotes: Number(yesVotes),
    noVotes: Number(noVotes),
    votesCount: Number(votesCount),
    finalized,
    executed,
  };
}

module.exports = {
  proposeWithdraw,
  voteProposal,
  getProposal,
};
