const donationVault = require("../donationVault");
const pool = require("../../db/pool");

async function startDonationListener() {
  console.log("🟢 Donation listener started");

const filter = donationVault.filters.Donated();

  donationVault.on(filter, async (event) => {
    try {
      const {
        campaignId,
        donor,
        token,
        amount,
        timestamp,
      } = event.args;

      const txHash = event.log.transactionHash;
      const blockNumber = event.log.blockNumber;


      const exists = await pool.query(
        "SELECT 1 FROM donations_onchain WHERE tx_hash = $1",
        [txHash]
      );
      if (exists.rowCount > 0) return;

      await pool.query(
        `
        INSERT INTO donations_onchain
          (onchain_campaign_id, donor_address, token_address, amount, tx_hash, block_number)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        `,
        [
          campaignId.toString(),
          donor,
          token,
          amount.toString(),
          txHash,
          blockNumber,
        ]
      );

      console.log("✅ Donasi tercatat:", txHash);
    } catch (err) {
      console.error("❌ Error indexing donation:", err);
    }
});


}

module.exports = startDonationListener;
