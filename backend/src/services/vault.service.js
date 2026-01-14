// services/vault.service.js
const { get } = require("http");
const vault = require("../blockchain/vault.contract");
const { ethers } = require("ethers");
const { VAULT_DEPLOY_BLOCK } = require("../blockchain/constant");

async function queryEventsChunked(filter, fromBlock, toBlock, step = 50000) {
  let events = [];

  for (let start = fromBlock; start <= toBlock; start += step) {
    const end = Math.min(start + step - 1, toBlock);
    const chunk = await vault.queryFilter(filter, start, end);
    events = events.concat(chunk);
  }

  return events;
}

async function getOnchainBalances(campaignId) {
  const USDT = await vault.USDT();
  const USDC = await vault.USDC();

  // Mengambil data raw (masih dikali 10^6)
  const [usdtRaw, usdcRaw] = await Promise.all([
    vault.getBalance(campaignId, USDT),
    vault.getBalance(campaignId, USDC),
  ]);

  return {
    // Format desimal 6 (standard USDT/USDC) menjadi angka biasa string
    // Contoh: 1000000 -> "1.0"
    USDT: ethers.formatUnits(usdtRaw, 6),
    USDC: ethers.formatUnits(usdcRaw, 6),
  };
}

// === RIWAYAT DONASI ONCHAIN ===
// Dipakai: event Donated
async function getOnchainDonations(campaignId) {
  const filter = vault.filters.Donated(campaignId);
  const logs = await vault.queryFilter(filter, 0, 'latest');

  return logs.map((l) => {
    const { donor, token, amount, timestamp } = l.args;
    return {
      donor,
      token,
      amount: amount.toString(),
      timestamp: Number(timestamp),
      txHash: l.transactionHash,
      blockNumber: l.blockNumber,
    };
  });
}


/**
 * =========================
 * SC-ONLY CAMPAIGN METADATA
 * =========================
 */

async function getScCampaign(campaignId) {
  try {
    const id = BigInt(campaignId);

    const [titleHash, deadline, creator, withdrawn] =
      await vault.getScCampaign(id);

    return {
      campaignId: id.toString(),
      titleHash,
      deadline: Number(deadline),
      creator,
      withdrawn,
      exists: true,
    };
  } catch (err) {
    return { exists: false };
  }
}


async function getAllScOnlyCampaigns() {
  const campaigns = [];
  let id = 2; // Asumsi campaignId dimulai dari 1 dan berurutan
  let keepFetching = true;
  // console.log("Mulai mengambil data via State Loop...");

  while (keepFetching) {
    try {
      const data = await vault.getScCampaign(id);

      // Jika berhasil (tidak revert), masukkan ke array
      campaigns.push({
        campaignId: id,
        titleHash: data.titleHash,
        deadline: Number(data.deadline),
        creator: data.creator,
        // status diambil dari boolean withdrawn
        status: data.withdrawn ? "Withdrawn" : "Active",
        txHash: null, 
        blockNumber: null 
      });

      id++; 


    } catch (error) {
      
      // Ethers v6 handling custom error/revert
      if (error.code === 'CALL_EXCEPTION' || error.message.includes("CampaignNotFound")) {
        console.log(`Stop fetching. Campaign ID ${id} tidak ditemukan.`);
        keepFetching = false; // Stop loop
      } else {
        // Jika error lain (misal koneksi putus), log dan stop atau retry
        console.error("Error tak terduga:", error);
        keepFetching = false;
      }
    }
  }

  return campaigns;
}

/**
 * =========================
 * HELPERS
 * =========================
 */

async function hasOnchainBalance(campaignId, tokens = []) {
  for (const token of tokens) {
    const bal = await vault.getBalance(campaignId, token);
    if (bal > 0n) return true;
  }
  return false;
}

module.exports = {
  getOnchainBalances,
  getOnchainDonations,
  getScCampaign,
  hasOnchainBalance
};
