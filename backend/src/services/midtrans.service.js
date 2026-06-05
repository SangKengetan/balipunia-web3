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
  const payload = {
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
    custom_expiry: {
      expiry_duration: 60,
      unit: "minute"
    }
  };

  if (bank === 'mandiri') {
    payload.payment_type = 'echannel';
    payload.echannel = {
      bill_info1: 'Pembayaran:',
      bill_info2: 'Donasi Kampanye'
    };
  } else {
    payload.payment_type = 'bank_transfer';
    payload.bank_transfer = { bank };
  }

  return await core.charge(payload);
}

// VERIFY WEBHOOK
async function verifyNotification(notificationJson) {
  return snap.transaction.notification(notificationJson);
}

// CREATE EWALLET / QRIS CHARGE + METADATA IDENTITAS
async function createEwalletCharge(orderId, amount, paymentType, donor = {}) {
  const payload = {
    payment_type: paymentType,
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
  };

  // Jika QRIS, kita bisa menspesifikkan acquirer jika dibutuhkan (tapi default sudah cukup)
  if (paymentType === "qris") {
    payload.qris = { acquirer: "gopay" };
  }

  return await core.charge(payload);
}

module.exports = {
  createBankTransfer,
  createEwalletCharge,
  verifyNotification,
};
