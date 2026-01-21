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
    try {
      const onchainCampaignId = BigInt(campaign.id_campaign_onchain);

      const balances = await getOnchainBalances(onchainCampaignId);

      // ✅ AMAN: storage-based, bukan event-based
      const transactions = await getOnchainDonations(onchainCampaignId);

      onchain = {
        balances,
        transactions,
      };
    } catch (err) {
      // ❗ Error on-chain TIDAK BOLEH bikin API gagal
      console.error("On-chain fetch failed:", err.message);

      onchain = {
        balances: { USDT: "0", USDC: "0" },
        transactions: [],
      };
    }
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

async function getScCampaignDetail(campaignId) {
  /**
   * 1) METADATA CAMPAIGN (DB)
   * =========================
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
      payout_wallet,
      is_onchain_enabled,
      is_sc_registered,
      is_withdrawn
    FROM campaigns
    WHERE id = $1
  `;

  const { rows } = await db.query(campaignQuery, [campaignId]);
  const campaign = rows[0];

  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");

  // ⛔ wajib SC-ONLY
  if (campaign.campaign_type !== "SC-ONLY") {
    throw new Error("FORBIDDEN_NON_SC_ONLY");
  }

  // ⛔ SC-ONLY wajib terdaftar on-chain
  if (!campaign.is_sc_registered || !campaign.id_campaign_onchain) {
    throw new Error("SC_NOT_REGISTERED_ONCHAIN");
  }

  /**
   * 2) ONCHAIN SECTION (SOURCE OF TRUTH)
   * ===================================
   */
  let onchain = {
    balances: { USDT: "0", USDC: "0" },
    transactions: [],
  };

  try {
    const onchainCampaignId = BigInt(campaign.id_campaign_onchain);

    // saldo on-chain
    const balances = await getOnchainBalances(onchainCampaignId);

    // riwayat donasi (storage-based, AMAN)
    const transactions = await getOnchainDonations(onchainCampaignId);

    onchain = {
      balances,
      transactions,
    };
  } catch (err) {
    // ❗ gagal on-chain TIDAK boleh bikin API mati
    console.error("SC on-chain fetch failed:", err.message);
  }

  /**
   * 3) FINAL RESPONSE (TIDAK ADA OFFCHAIN)
   * =====================================
   */
  return {
    campaign,
    onchain,
    offchain: null, // ⛔ memang tidak ada untuk SC-ONLY
  };
}

async function getCampaignType(campaignId) {
  const { rows } = await db.query(
    `SELECT campaign_type FROM campaigns WHERE id = $1`,
    [campaignId]
  );

  if (!rows.length) {
    throw new Error('CAMPAIGN_NOT_FOUND');
  }

  return rows[0];
}


module.exports = {
  getHybridCampaignDetail, getScCampaignDetail, getCampaignType
};
