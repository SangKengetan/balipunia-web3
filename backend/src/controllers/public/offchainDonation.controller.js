const {
  getOffchainDonationStatus,
} = require('../../services/public/offchainDonation.service');

async function checkDonationStatus(req, res) {
  try {
    const { orderId } = req.params;
    const status = await getOffchainDonationStatus(orderId);
    res.json(status);
  } catch (err) {
    if (err.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  checkDonationStatus,
};
