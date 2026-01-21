//services/blockchain/voting.js
import { ethers } from "ethers";
import { getSigner } from "./provider";
import {
  VOTING_ADDRESS
} from "./constants";
import VotingABI from "./abi/VotingABI.json";

function getVotingContract() {
  const signer = getSigner(); // MetaMask signer
  if (!signer) {
    throw new Error("SIGNER_NOT_READY");
  }

  return new ethers.Contract(
    VOTING_ADDRESS,
    VotingABI,
    signer
  );
}

export async function proposeWithdraw(campaignId) {
  const signer = await getSigner();

  const contract = new ethers.Contract(
    VOTING_ADDRESS,
    VotingABI,
    signer
  );

  const tx = await contract.proposeWithdraw(campaignId);
  const receipt = await tx.wait();

  // ambil proposalId dari event
  const event = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "WithdrawProposed");

  if (!event) {
    throw new Error("WithdrawProposed event tidak ditemukan");
  }

  return event.args.proposalId.toString();
}

/**
 * Trustee vote on proposal
 * @param {string|number} proposalId
 * @param {boolean} support  true = approve, false = reject
 */
export async function voteProposal(proposalId, support) {
  const signer = await getSigner();

  const contract = new ethers.Contract(
    VOTING_ADDRESS,
    VotingABI,
    signer
  );

  const tx = await contract.vote(proposalId, support);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    proposalId: proposalId.toString(),
    support,
  };
}

export async function getProposal(proposalId) {

  const votingContract = getVotingContract();
  const [
    campaignId,
    yesVotes,
    noVotes,
    votesCount,
    status,
    executed,
  ] = await votingContract.getProposal(proposalId);

  return {
    campaignId: campaignId.toString(),
    yesVotes: Number(yesVotes),
    noVotes: Number(noVotes),
    votesCount: Number(votesCount),
    status,
    executed,
  };
}