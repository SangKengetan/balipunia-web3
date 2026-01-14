const express = require('express');
const router = express.Router();

const { createBankPayment } = require('../controllers/payment.controller');

router.post('/bank-transfer', createBankPayment);

module.exports = router;
