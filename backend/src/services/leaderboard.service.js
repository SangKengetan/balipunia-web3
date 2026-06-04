const pool = require("../db/pool");
const vaultService = require("./vault.service");
const { ethers } = require("ethers");

/**
 * Mendapatkan Top Donatur Rupiah (Off-chain)
 * @param {Object} filters { limit, campaignId, adminPuraId }
 */
async function getOffchainLeaderboard({ limit = 5, campaignId, adminPuraId } = {}) {
  let baseQuery = `
    SELECT 
      t.donor_name as name, 
      SUM(t.gross_amount) as total_amount
    FROM offchain_transactions t
  `;
  const params = [];
  const whereClauses = ["t.system_status IN ('PAID_LOCKED', 'APPROVED', 'WITHDRAWN')"];

  if (adminPuraId) {
    baseQuery += ` JOIN campaigns c ON c.id = t.campaign_id `;
    whereClauses.push(`c.admin_pura_id = $${params.length + 1}`);
    params.push(adminPuraId);
  }

  if (campaignId) {
    whereClauses.push(`t.campaign_id = $${params.length + 1}`);
    params.push(campaignId);
  }

  if (whereClauses.length > 0) {
    baseQuery += ` WHERE ` + whereClauses.join(" AND ");
  }

  baseQuery += `
    GROUP BY t.donor_name
    ORDER BY total_amount DESC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const { rows } = await pool.query(baseQuery, params);
  
  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    total_amount: row.total_amount,
  }));
}

/**
 * Mendapatkan Top Donatur Kripto (On-chain)
 * Menyatukan saldo dari multiple wallet yang dimiliki 1 user
 * @param {Object} filters { limit, campaignId, adminPuraId }
 */
async function getOnchainLeaderboard({ limit = 5, campaignId, adminPuraId } = {}) {
  // 1. Dapatkan daftar campaign on-chain id yang relevan
  let campaignQuery = `SELECT id_campaign_onchain FROM campaigns WHERE id_campaign_onchain IS NOT NULL`;
  const campParams = [];
  const campWhere = [];

  if (adminPuraId) {
    campWhere.push(`admin_pura_id = $${campParams.length + 1}`);
    campParams.push(adminPuraId);
  }
  if (campaignId) {
    campWhere.push(`id = $${campParams.length + 1}`);
    campParams.push(campaignId);
  }

  if (campWhere.length > 0) {
    campaignQuery += ` AND ` + campWhere.join(" AND ");
  }

  const { rows: campaigns } = await pool.query(campaignQuery, campParams);
  
  if (campaigns.length === 0) return [];

  // 2. Tarik riwayat donasi dari smart contract untuk semua campaign tersebut
  let allDonations = [];
  for (const c of campaigns) {
    const cid = c.id_campaign_onchain;
    try {
      const logs = await vaultService.getDonationHistory({ campaignId: cid });
      allDonations = allDonations.concat(logs);
    } catch (err) {
      console.error(`Gagal menarik history untuk campaign onchain ${cid}:`, err.message);
    }
  }

  if (allDonations.length === 0) return [];

  // 3. Agregasi per wallet_address
  // Format donations: { donor: "0x...", amount: "10.5", token: "0x..." }
  const walletTotals = {};
  for (const d of allDonations) {
    const wallet = d.donor.toLowerCase();
    const amountVal = parseFloat(ethers.formatUnits(d.amount, 18));
    
    if (!walletTotals[wallet]) {
      walletTotals[wallet] = 0;
    }
    walletTotals[wallet] += amountVal;
  }

  // 4. Hubungkan wallet ke nama donor_wallets -> donors
  const uniqueWallets = Object.keys(walletTotals);
  const { rows: donorRows } = await pool.query(
    `SELECT d.id AS donor_id, d.name, LOWER(dw.wallet_address) AS wallet_address 
     FROM donor_wallets dw 
     JOIN donors d ON d.id = dw.donor_id 
     WHERE LOWER(dw.wallet_address) = ANY($1)`,
    [uniqueWallets]
  );

  // Buat mapping
  const walletToDonor = {};
  for (const r of donorRows) {
    walletToDonor[r.wallet_address] = {
      id: r.donor_id,
      name: r.name
    };
  }

  // 5. Gabungkan saldo jika 1 donor punya banyak wallet
  const donorTotals = {};
  const unknownWallets = [];

  for (const wallet of uniqueWallets) {
    const total = walletTotals[wallet];
    const donor = walletToDonor[wallet];

    if (donor) {
      if (!donorTotals[donor.id]) {
        donorTotals[donor.id] = { name: donor.name, total: 0 };
      }
      donorTotals[donor.id].total += total;
    } else {
      // Wallet tidak terdaftar
      unknownWallets.push({ wallet, total });
    }
  }

  // 6. Siapkan array akhir untuk diurutkan
  const finalLeaderboard = [];
  
  // Masukkan yang punya akun
  for (const dId in donorTotals) {
    finalLeaderboard.push({
      name: donorTotals[dId].name,
      total_amount: donorTotals[dId].total
    });
  }

  // Masukkan yang tidak terdaftar (Anonim)
  for (const uw of unknownWallets) {
    const shortWallet = `${uw.wallet.slice(0, 6)}...${uw.wallet.slice(-4)}`;
    finalLeaderboard.push({
      name: `Hamba Sang Hyang Widhi (${shortWallet})`,
      total_amount: uw.total
    });
  }

  // 7. Sort dan Limit
  finalLeaderboard.sort((a, b) => b.total_amount - a.total_amount);
  
  const sliced = finalLeaderboard.slice(0, limit);
  return sliced.map((item, index) => ({
    rank: index + 1,
    name: item.name,
    total_amount: item.total_amount.toString(),
  }));
}

/**
 * Rank khusus untuk Donor berdasarkan tokennya
 */
async function getDonorGlobalRank(donorId) {
  // 1. Ambil nama donor untuk offchain rank
  const { rows: donorInfo } = await pool.query(`SELECT name FROM donors WHERE id = $1`, [donorId]);
  if (!donorInfo.length) return null;
  const donorName = donorInfo[0].name;

  // 2. Ambil semua offchain leaderboard (tanpa limit)
  const offchainData = await getOffchainLeaderboard({ limit: 1000000 });
  let offchainRank = offchainData.findIndex(d => d.name === donorName) + 1;
  const offchainTotalDonors = offchainData.length;

  // 3. Ambil semua onchain leaderboard (tanpa limit)
  const onchainData = await getOnchainLeaderboard({ limit: 1000000 });
  let onchainRank = onchainData.findIndex(d => d.name === donorName) + 1;
  const onchainTotalDonors = onchainData.length;

  return {
    offchain: {
      rank: offchainRank > 0 ? offchainRank : null,
      total_donors: offchainTotalDonors
    },
    onchain: {
      rank: onchainRank > 0 ? onchainRank : null,
      total_donors: onchainTotalDonors
    }
  };
}

module.exports = {
  getOffchainLeaderboard,
  getOnchainLeaderboard,
  getDonorGlobalRank
};
