const pool = require("../db/pool");
const { getOnchainDonations } = require("../services/vault.service");

async function getMyDonations(req, res) {
  try {
    const donorId = req.donor.id;
    const walletAddress = req.donor.wallet_address;

    // 1. Fetch Off-chain Donations
    const offchainQuery = `
      SELECT 
        ot.order_id,
        ot.gross_amount,
        ot.system_status,
        ot.updated_at,
        ot.bank,
        c.title AS campaign_title,
        c.id AS campaign_id
      FROM offchain_transactions ot
      JOIN campaigns c ON c.id = ot.campaign_id
      WHERE ot.donor_id = $1
      ORDER BY ot.updated_at DESC
    `;
    const offchainResult = await pool.query(offchainQuery, [donorId]);

    // 2. Fetch On-chain Donations (if wallet is linked)
    let onchainDonations = [];
    if (walletAddress) {
      // Get all campaigns with onchain enabled
      const campaignsQuery = `
        SELECT id, id_campaign_onchain, title 
        FROM campaigns 
        WHERE id_campaign_onchain IS NOT NULL
      `;
      const campaignsResult = await pool.query(campaignsQuery);

      const fetchPromises = campaignsResult.rows.map(async (campaign) => {
        try {
          const onchainCampaignId = BigInt(campaign.id_campaign_onchain);
          const donations = await getOnchainDonations(onchainCampaignId);
          
          // Filter donations belonging to this wallet address
          return donations
            .filter((d) => d.donor.toLowerCase() === walletAddress.toLowerCase())
            .map((d) => ({
              ...d,
              campaign_id: campaign.id,
              campaign_title: campaign.title,
            }));
        } catch (err) {
          console.error(`Failed to fetch on-chain donations for campaign ${campaign.id}:`, err.message);
          return [];
        }
      });

      const fetchedResults = await Promise.all(fetchPromises);
      onchainDonations = fetchedResults.flat();
      
      // Sort on-chain donations by timestamp descending
      onchainDonations.sort((a, b) => b.timestamp - a.timestamp);
    }

    return res.json({
      offchain: offchainResult.rows,
      onchain: onchainDonations,
    });

  } catch (err) {
    console.error("[GET MY DONATIONS ERROR]", err);
    return res.status(500).json({ message: "Failed to retrieve donation history" });
  }
}

module.exports = {
  getMyDonations,
};
