const pool = require('../db/pool');
const { createBankTransfer } = require('../services/midtrans.service');
const { v4: uuidv4 } = require('uuid');

// CREATE PAYMENT
async function createBankPayment(req, res) {
  try {
    const {
      campaign_id,
      amount,
      bank,
      donor_name,
      donor_contact,
      is_anonymous = false
    } = req.body;

    if (!campaign_id || !amount || !bank) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const orderId = `PUNIA-${uuidv4()}`;

    await pool.query(
      `
      INSERT INTO offchain_transactions (
        campaign_id,
        order_id,
        gross_amount,
        system_status,
        donor_name,
        donor_contact,
        is_anonymous
      )
      VALUES ($1, $2, $3, 'PAID_LOCKED', $4, $5, $6)
      `,
      [
        campaign_id,
        orderId,
        amount,
        is_anonymous ? null : donor_name,
        donor_contact || null,
        is_anonymous
      ]
    );

    const chargeResponse = await createBankTransfer(
      orderId,
      amount,
      bank,
      {
        name: is_anonymous ? 'Anonim' : donor_name
      }
    );

    const va = chargeResponse.va_numbers?.[0];

    return res.status(201).json({
      order_id: orderId,
      bank: va.bank,
      va_number: va.va_number,
      amount,
      expires_at: chargeResponse.expiry_time
    });

  } catch (err) {
    console.error('[CREATE BANK PAYMENT ERROR]', err);
    return res.status(500).json({ message: 'Payment failed' });
  }
}

module.exports = {
  createBankPayment
};
