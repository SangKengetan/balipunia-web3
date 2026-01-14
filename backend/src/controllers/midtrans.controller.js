const crypto = require("crypto");
const db = require("../db/pool");

async function handleMidtransWebhook(req, res) {
  console.log("🔥 MIDTRANS WEBHOOK MASUK");
  console.log(req.body);

  const n = req.body;

  const {
    order_id,
    transaction_status,
    fraud_status,
    settlement_time,
    transaction_time,
    gross_amount: grossAmountMidtrans,
    payment_type,
    bank,
    card_type,
    status_code,
    signature_key,
  } = n;

  /**
   * 1) VERIFIKASI SIGNATURE (WAJIB)
   */
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  if (signature_key !== expectedSignature) {
    return res.status(403).json({ message: "Invalid signature" });
  }

  /**
   * 2) UPDATE offchain_transactions
   */
  const updateTxQuery = `
    UPDATE offchain_transactions
    SET
      midtrans_status = $1,
      system_status = CASE
        WHEN $1 = 'settlement' THEN 'SETTLED'
        WHEN $1 = 'pending' THEN 'PENDING_PAYMENT'
        WHEN $1 = 'expire' THEN 'EXPIRED'
        WHEN $1 IN ('cancel','deny') THEN 'FAILED'
        WHEN $1 = 'refund' THEN 'REFUNDED'
        ELSE system_status
      END,
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

  const result = await db.query(updateTxQuery, [
    transaction_status,
    fraud_status || null,
    settlement_time || null,
    transaction_time || null,
    payment_type || null,
    bank || null,
    card_type || null,
    n,
    order_id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Order ID not found" });
  }

  const { campaign_id, gross_amount,system_status } = result.rows[0];

  /**
   * 3) UPDATE SALDO CAMPAIGN (HANYA SEKALI)
   */
  if (transaction_status === "settlement") {
    const updateCampaignQuery = `
      UPDATE campaigns
      SET
        offchain_amount = offchain_amount + $1
      WHERE id = $2
    `;
    await db.query(updateCampaignQuery, [
      gross_amount,
      campaign_id,
    ]);
  }

  return res.status(200).json({ message: "OK" });
}

module.exports = { handleMidtransWebhook };
