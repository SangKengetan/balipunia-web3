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
    const donorId = req.donor.id;
    const finalDonorName = is_anonymous ? 'Anonim' : (donor_name || req.donor.name);
    const finalDonorContact = donor_contact || req.donor.contact || null;

    await pool.query(
      `
      INSERT INTO offchain_transactions (
        campaign_id,
        order_id,
        gross_amount,
        system_status,
        donor_name,
        donor_contact,
        is_anonymous,
        donor_id
      )
      VALUES ($1, $2, $3, 'PAID_LOCKED', $4, $5, $6, $7)
      `,
      [
        campaign_id,
        orderId,
        amount,
        is_anonymous ? null : finalDonorName,
        finalDonorContact,
        is_anonymous,
        donorId
      ]
    );

    const chargeResponse = await createBankTransfer(
      orderId,
      amount,
      bank,
      {
        name: finalDonorName
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
