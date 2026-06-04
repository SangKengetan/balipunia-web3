const midtransClient = require('midtrans-client');

const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// CREATE BANK TRANSFER + METADATA IDENTITAS
async function createBankTransfer(orderId, amount, bank, donor = {}) {
  return await core.charge({
    payment_type: "bank_transfer",
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: [
      {
        id: orderId,
        price: amount,
        quantity: 1,
        name: `Donasi Kampanye - ${donor.name || "Anonim"}`
      }
    ],
    custom_field1: donor.name || "Anonim",
    custom_field2: donor.wallet || null,
    custom_field3: donor.message || null,
    bank_transfer: {
      bank
    },
    custom_expiry: {
      expiry_duration: 60,
      unit: "minute"
    }
  });
}

// VERIFY WEBHOOK
async function verifyNotification(notificationJson) {
  return snap.transaction.notification(notificationJson);
}

module.exports = {
  createBankTransfer,
  verifyNotification,
};
