const express = require('express');
const router = express.Router();

const { createBankPayment, createEwalletPayment, getPaymentStatus } = require('../controllers/payment.controller');
const { getMyDonations } = require('../controllers/donorHistory.controller');
const { authenticateDonor } = require('../middlewares/auth.middleware');

router.post('/bank-transfer', authenticateDonor, createBankPayment);
router.post('/ewallet', authenticateDonor, createEwalletPayment);
router.get('/my-donations', authenticateDonor, getMyDonations);
router.get('/status/:orderId', authenticateDonor, getPaymentStatus);

module.exports = router;
