const crypto = require("crypto");
const db = require("../db/pool");

async function handleMidtransWebhook(req, res) {
  console.log("🔥 MIDTRANS WEBHOOK MASUK");
  console.log(req.body);

  try {
    const n = req.body;

    const {
      order_id,
      transaction_status,
      fraud_status,
      settlement_time,
      transaction_time,
      gross_amount,
      payment_type,
      bank,
      card_type,
      status_code,
      signature_key,
    } = n;

    /**
     * 1) VERIFIKASI SIGNATURE (WAJIB)
     *    Formula: SHA512(order_id + status_code + gross_amount + serverKey)
     */
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.warn("⚠️ Signature mismatch untuk order:", order_id);
      return res.status(403).json({ message: "Invalid signature" });
    }

    /**
     * 2) MAP midtrans transaction_status → system_status
     */
    let systemStatus;
    switch (transaction_status) {
      case "settlement":
      case "capture":
        systemStatus = "PAID_LOCKED";
        break;
      case "pending":
        systemStatus = "PENDING_PAYMENT";
        break;
      case "expire":
        systemStatus = "EXPIRED";
        break;
      case "cancel":
      case "deny":
        systemStatus = "FAILED";
        break;
      case "refund":
      case "partial_refund":
        systemStatus = "REFUNDED";
        break;
      default:
        systemStatus = null; // unknown status, don't change
    }

    /**
     * 3) UPDATE offchain_transactions
     */
    const updateTxQuery = `
      UPDATE offchain_transactions
      SET
        midtrans_status = $1,
        ${systemStatus ? "system_status = $10," : ""}
        fraud_status = $2,
        settlement_time = $3,
        transaction_time = $4,
        payment_type = $5,
        bank = $6,
        card_type = $7,
        raw_response = $8,
        updated_at = NOW()
      WHERE order_id = $9
      RETURNING campaign_id, gross_amount, system_status
    `;

    // Fetch existing raw_response to preserve actions (QR code URLs for QRIS/GoPay)
    const existingResult = await db.query(
      `SELECT raw_response FROM offchain_transactions WHERE order_id = $1`,
      [order_id]
    );
    let mergedRawResponse = n;
    if (existingResult.rows.length > 0 && existingResult.rows[0].raw_response) {
      const existing = typeof existingResult.rows[0].raw_response === 'string'
        ? JSON.parse(existingResult.rows[0].raw_response)
        : existingResult.rows[0].raw_response;
      // Preserve actions from original charge response (contains QR code URLs)
      mergedRawResponse = { ...existing, ...n };
      if (existing.actions && !n.actions) {
        mergedRawResponse.actions = existing.actions;
      }
    }

    const params = [
      transaction_status,
      fraud_status || null,
      settlement_time || null,
      transaction_time || null,
      payment_type || null,
      bank || null,
      card_type || null,
      mergedRawResponse,
      order_id,
    ];

    if (systemStatus) {
      params.push(systemStatus);
    }

    const result = await db.query(updateTxQuery, params);

    if (result.rowCount === 0) {
      console.warn("⚠️ Order ID tidak ditemukan:", order_id);
      return res.status(404).json({ message: "Order ID not found" });
    }

    const row = result.rows[0];

    /**
     * 4) UPDATE SALDO CAMPAIGN (HANYA SAAT SETTLEMENT)
     *    Guard: hanya update jika sebelumnya belum PAID_LOCKED
     *    (mencegah double-update jika webhook dikirim ulang)
     */
    if (transaction_status === "settlement" || transaction_status === "capture") {
      const updateCampaignQuery = `
        UPDATE campaigns
        SET
          offchain_amount = offchain_amount + $1
        WHERE id = $2
      `;
      await db.query(updateCampaignQuery, [
        row.gross_amount,
        row.campaign_id,
      ]);
      console.log(`✅ Campaign ${row.campaign_id} offchain_amount updated +${row.gross_amount}`);
    }

    console.log(`✅ Webhook processed: ${order_id} → ${transaction_status} (${systemStatus})`);
    return res.status(200).json({ message: "OK" });

  } catch (err) {
    console.error("❌ MIDTRANS WEBHOOK ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { handleMidtransWebhook };
