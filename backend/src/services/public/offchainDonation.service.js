const { get } = require('http');
const pool = require('../../db/pool');

async function getOffchainDonations(req, res) {
  try {
    const { campaign_id } = req.query;

    const result = await pool.query(
      `
      SELECT
        CASE
          WHEN is_anonymous THEN 'Anonim'
          ELSE donor_name
        END AS donor_name,
        gross_amount,
        updated_at
      FROM offchain_transactions
      WHERE campaign_id = $1
        AND system_status = 'PAID_LOCKED'
      ORDER BY updated_at DESC
      `,
      [campaign_id]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error('[GET OFFCHAIN DONATIONS ERROR]', err);
    return res.status(500).json({ message: 'Failed to fetch donations' });
  }
}


module.exports = {
  getOffchainDonations,
};
