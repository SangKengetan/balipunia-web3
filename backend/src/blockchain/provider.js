const { ethers } = require("ethers");

const provider = new ethers.WebSocketProvider(
  process.env.BSC_TESTNET_RPC
);

module.exports = provider;
