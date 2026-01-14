const { get } = require('http');
const db = require('../../db/pool');
const {
  getOnchainBalances,
  getOnchainDonations
} = require('../../services/vault.service');


async function getHybridCampaignDetail(campaignId) {
  /**
   * 1) METADATA CAMPAIGN (DB)
   */
  const campaignQuery = `
    SELECT
      id,
      title,
      description,
      purpose,
      campaign_type,
      status,
      deadline,
      id_campaign_onchain,
      is_onchain_enabled,
      is_offchain_enabled
    FROM campaigns
    WHERE id = $1
  `;
  const { rows } = await db.query(campaignQuery, [campaignId]);
  const campaign = rows[0];

  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');
  if (campaign.campaign_type === 'SC-ONLY') {
    throw new Error('FORBIDDEN_SC_ONLY');
  }

  /**
   * 2) ONCHAIN SECTION (SC)
   */
  let onchain = {
    balances: null,
    transactions: [],
  };

  if (campaign.is_onchain_enabled) {
    const balances = await getOnchainBalances(
      campaign.id_campaign_onchain
    );

    /* Error kena limmit RPC
    "message": "could not coalesce error (error={ \"code\": -32701, \"message\": 
    \"exceed maximum block range: 50000\" }, payload={ \"id\": 9, \"jsonrpc\": \"2.0\", 
    \"method\": \"eth_getLogs\", \"params\": [ { \"address\": 
    \"0x542b7108768fdec91a0138fb3f2136922b3d7e4b\", \"fromBlock\": \
    "0x0\", \"toBlock\": \"latest\", \"topics\": [ \
    "0x6a6e386e51cd750cad0d20fb9051c1f9c15b8c5db2fad1d9ca099cdef0d57ccf\", 
    \"0x0000000000000000000000000000000000000000000000000000000000000001\" ] } ] }, 
    code=UNKNOWN_ERROR, version=6.16.0)"
    
    // const transactions = await getOnchainDonations(
    //   campaign.id_campaign_onchain
    // );*/

    onchain = {
      balances,
      transactions: [],
    };
  }

  /**
   * 3) OFFCHAIN SECTION (MIDTRANS → DB)
   */
  let offchain = {
    total: '0',
    transactions: [],
  };

  if (campaign.is_offchain_enabled) {
    // Total dana offchain (HANYA yang SETTLEMENT)
    const totalQuery = `
      SELECT
        COALESCE(SUM(gross_amount), 0) AS total
      FROM offchain_transactions
      WHERE campaign_id = $1
        AND system_status = 'PAID_LOCKED'
    `;
    const totalResult = await db.query(totalQuery, [campaignId]);

    // Riwayat donasi offchain (public-safe)
    const txQuery = `
      SELECT
        CASE
          WHEN is_anonymous = true THEN 'Anonim'
          ELSE donor_name
        END AS donor_name,
        gross_amount,
        updated_at
      FROM offchain_transactions
      WHERE campaign_id = $1
        AND system_status = 'PAID_LOCKED'
      ORDER BY updated_at DESC
      LIMIT 20
    `;
    const txResult = await db.query(txQuery, [campaignId]);

    offchain = {
      total: totalResult.rows[0].total,
      transactions: txResult.rows,
    };
  }

  /**
   * 4) FINAL RESPONSE
   */
  return {
    campaign,
    onchain,
    offchain,
  };
}

module.exports = {
  getHybridCampaignDetail
};
