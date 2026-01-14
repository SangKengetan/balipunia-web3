const { Contract } = require("ethers");
const provider = require("./provider");
const votingAbi = require("./abi/VotingABI.json");

const votingContract = new Contract(
  process.env.VOTING_CONTRACT_ADDRESS,
  votingAbi,
  provider
);

module.exports = votingContract;
