const express = require('express');
const router = express.Router();

const puraController = require('../controllers/public/pura.controller');
const financialReportController = require('../controllers/public/financialReport.controller');
const offchainDonationController = require('../controllers/public/offchainDonation.controller');
const campaignController = require('../controllers/public/campaign.controller');
const campaignTimelineController = require('../controllers/public/campaignTimeline.controller');
const {getPublicSCCampaignDetail} = require("../controllers/public/campaign.controller");

router.get('/pura', puraController.listPura);
router.get('/pura/:puraId', puraController.getPuraDetail);

// List laporan keuangan per pura
router.get(
  '/pura/:puraId/financial-reports',
  financialReportController.listFinancialReportsByPura
);
// Detail laporan keuangan
router.get(
  '/financial-reports/:id',
  financialReportController.getFinancialReportDetail
);


router.get(
  '/offchain-transactions/:orderId/status',
  offchainDonationController.checkDonationStatus
);


// Detail campaign (HYBRID)
router.get(
  '/campaigns/:id',
  campaignController.getHybridCampaignDetail
);

router.get(
  "/campaigns/sc/:id_campaign_onchain",
  getPublicSCCampaignDetail
);

// Timeline campaign
router.get(
  '/campaigns/:id/timeline',
  campaignTimelineController.getCampaignTimeline
);

module.exports = router;


module.exports = router;
