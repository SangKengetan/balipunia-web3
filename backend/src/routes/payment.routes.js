const express = require('express');
const router = express.Router();

const { createBankPayment } = require('../controllers/payment.controller');
const { getMyDonations } = require('../controllers/donorHistory.controller');
const { authenticateDonor } = require('../middlewares/auth.middleware');

router.post('/bank-transfer', authenticateDonor, createBankPayment);
router.get('/my-donations', authenticateDonor, getMyDonations);

module.exports = router;
