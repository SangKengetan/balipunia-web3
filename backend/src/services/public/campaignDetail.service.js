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
      fund_mechanism,
      campaign_type,
      status,
      deadline,
      id_campaign_onchain,
      image_url
    FROM campaigns
    WHERE id = $1
  `;
  const { rows } = await db.query(campaignQuery, [campaignId]);
  const campaign = rows[0];

  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');
  if (campaign.campaign_type === 'CRYPTO_ONLY') {
    throw new Error('FORBIDDEN_CRYPTO_ONLY');
  }

  /**
   * 2) ONCHAIN SECTION (SC)
   */
  let onchain = {
    balances: null,
    transactions: [],
  };

  // On-chain data untuk HYBRID dan CRYPTO_ONLY
  if (campaign.campaign_type !== 'MIDTRANS_ONLY' && campaign.id_campaign_onchain) {
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

  // Offchain data untuk HYBRID dan MIDTRANS_ONLY
  if (campaign.campaign_type !== 'CRYPTO_ONLY') {
    const totalQuery = `
      SELECT
        COALESCE(SUM(gross_amount), 0) AS total,
        COUNT(id) AS tx_count
      FROM offchain_transactions
      WHERE campaign_id = $1
        AND system_status = 'PAID_LOCKED'
    `;
    const totalResult = await db.query(totalQuery, [campaignId]);

    let calculatedTotal = Number(totalResult.rows[0].total);

    // Kurangi dengan total Rupiah yang sudah berhasil ditarik
    const withdrawnQuery = `
      SELECT COALESCE(
        SUM(
          CASE 
            WHEN amount_snapshot IS NOT NULL AND amount_snapshot <> '' 
            THEN (amount_snapshot::jsonb->'fiat'->>'amount_idr')::numeric 
            ELSE 0 
          END
        ), 
        0
      ) AS total_withdrawn
      FROM withdraw_requests
      WHERE campaign_id = $1
        AND status IN ('COMPLETED', 'EXECUTED')
    `;
    const withdrawnResult = await db.query(withdrawnQuery, [campaignId]);
    
    let currentBalance = calculatedTotal - Number(withdrawnResult.rows[0].total_withdrawn);
    if (currentBalance < 0) currentBalance = 0;
    
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

    // Riwayat pencairan dana (withdrawals)
    const withdrawalsQuery = `
      SELECT 
        id, 
        status, 
        withdraw_type, 
        amount_snapshot, 
        reason,
        created_at,
        transferred_at,
        total_idr,
        transfer_proof_cid
      FROM withdraw_requests
      WHERE campaign_id = $1
      ORDER BY created_at DESC
    `;
    const withdrawalsResult = await db.query(withdrawalsQuery, [campaignId]);

    offchain = {
      total_collected: calculatedTotal.toString(),
      current_balance: currentBalance.toString(),
      txCount: parseInt(totalResult.rows[0].tx_count || 0, 10),
      transactions: txResult.rows,
      withdrawals: withdrawalsResult.rows,
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
      fund_mechanism,
      campaign_type,
      status,
      deadline,
      id_campaign_onchain,
      payout_wallet,
      image_url
    FROM campaigns
    WHERE id = $1
  `;

  const { rows } = await db.query(campaignQuery, [campaignId]);
  const campaign = rows[0];

  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");

  // ⛔ wajib CRYPTO_ONLY
  if (campaign.campaign_type !== "CRYPTO_ONLY") {
    throw new Error("FORBIDDEN_NON_CRYPTO_ONLY");
  }

  // Semua kampanye sekarang terdaftar on-chain, cek id_campaign_onchain saja
  if (!campaign.id_campaign_onchain) {
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
