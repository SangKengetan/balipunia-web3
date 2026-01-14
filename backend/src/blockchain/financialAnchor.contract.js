const { ethers } = require("ethers");
const provider = require("./provider");
const ABI = require("./abi/FinancialReportAnchor.json");

const FINANCIAL_ANCHOR_ADDRESS =
  process.env.FINANCIAL_REPORT_ANCHOR_ADDRESS;


const systemSigner = new ethers.Wallet(
  process.env.SUPER_ADMIN_PRIVATE_KEY,
  provider
);

// 📜 Contract instance (SUDAH TERHUBUNG SIGNER)
const financialAnchor = new ethers.Contract(
  FINANCIAL_ANCHOR_ADDRESS,
  ABI,
  systemSigner
);

module.exports = financialAnchor;
