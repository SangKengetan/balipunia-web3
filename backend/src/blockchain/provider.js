const { JsonRpcProvider } = require("ethers");

const provider = new JsonRpcProvider(
  process.env.BSC_TESTNET_RPC
);

module.exports = provider;
