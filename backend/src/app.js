const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRoutes);
app.use("/reports", reportRoutes);

module.exports = app;
