const express = require("express");
const router = express.Router();

router.use("/campaigns", require("./campaign.routes"));
router.use("/campaign-reports", require("./campaignReport.routes"));
router.use("/dashboard", require("./dashboard.routes"));
router.use("/financereports", require("./financialReport.routes"));
router.use("/profile", require("./profile.routes"));
router.use("/withdraws", require("./withdraw.routes"));

module.exports = router;
