// services/vault.service.js
const vault = require("../blockchain/vault.contract");
const { ethers } = require("ethers");

/**
 * =========================
 * ONCHAIN BALANCES
 * =========================
 */
async function getOnchainBalances(campaignId) {
  const USDT_ADDR = await vault.USDT();
  const USDC_ADDR = await vault.USDC();

  const [usdtRaw, usdcRaw] = await Promise.all([
    vault.getBalance(campaignId, USDT_ADDR),
    vault.getBalance(campaignId, USDC_ADDR),
  ]);

  const usdtStr = usdtRaw.toString();
  const usdcStr = usdcRaw.toString();

  return {
    USDT: usdtStr,
    USDC: usdcStr,
    [USDT_ADDR]: usdtStr,
    [USDC_ADDR]: usdcStr,
    [USDT_ADDR.toLowerCase()]: usdtStr,
    [USDC_ADDR.toLowerCase()]: usdcStr,
  };
}

/**
 * =========================
 * ONCHAIN BALANCES RAW (BIGINT)
 * =========================
 */
async function getCampaignBalancesRaw(campaignId, tokens) {
  const balances = {};
  await Promise.all(
    tokens.map(async (tokenAddress) => {
      const bal = await vault.getBalance(campaignId, tokenAddress);
      balances[tokenAddress] = bal; // BigInt raw
    })
  );
  return balances;
}

/**
 * =========================
 * DONATION HISTORY (ONCHAIN)
 * =========================
 * SOURCE: donationHistory storage
 */
async function getOnchainDonations(campaignId) {
  const count = Number(await vault.getDonationCount(campaignId));
  if (count === 0) return [];

  const calls = [];
  for (let i = 0; i < count; i++) {
    calls.push(vault.getDonationHistory(campaignId, i));
  }

  const results = await Promise.all(calls);

  return results.map((d) => ({
    donor: d[0],
    token: d[1],
    amount: d[2].toString(),
    timestamp: Number(d[3]),
  }));
}

async function getDonationHistory({ campaignId }) {
  return getOnchainDonations(campaignId);
}

/**
 * =========================
 * CAMPAIGN METADATA
 * =========================
 */
async function getCampaign(campaignId) {
  try {
    const [
      campaignType,
      adminPuraWallet,
      payoutWallet,
      deadline,
      withdrawn,
    ] = await vault.getCampaign(campaignId);

    return {
      campaignId: campaignId.toString(),
      campaignType: Number(campaignType) === 0 ? "SC_ONLY" : "HYBRID",
      adminPuraWallet,
      payoutWallet,
      deadline: Number(deadline),
      withdrawn,
      exists: true,
    };
  } catch (err) {
    return { exists: false };
  }
}

/**
 * =========================
 * HELPERS
 * =========================
 */
async function hasOnchainBalance(campaignId) {
  const USDT = await vault.USDT();
  const USDC = await vault.USDC();

  const [usdt, usdc] = await Promise.all([
    vault.getBalance(campaignId, USDT),
    vault.getBalance(campaignId, USDC),
  ]);

  return usdt > 0n || usdc > 0n;
}

module.exports = {
  getOnchainBalances,
  getCampaignBalances: getOnchainBalances, // alias
  getCampaignBalancesRaw,
  getOnchainDonations,
  getDonationHistory, // alias
  getCampaign,
  getScCampaign: getCampaign, // alias
  hasOnchainBalance,
};
