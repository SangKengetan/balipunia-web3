const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const campaignRotes = require("./routes/campaign.routes");
const publicCampaignRoutes = require("./routes/publicCampaign.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/reports", reportRoutes);
app.use("/campaigns", campaignRotes);
app.use("/public", publicCampaignRoutes);


const startDonationListener = require(
  "./blockchain/listeners/donationListener"
);
startDonationListener();




module.exports = app;
