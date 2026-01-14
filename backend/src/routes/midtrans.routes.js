const express = require("express");
const router = express.Router();
const { handleMidtransWebhook } = require("../controllers/midtrans.controller");

router.post("/midtrans", handleMidtransWebhook);

module.exports = router;
