const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const offchainWithdrawalRoutes = require("./routes/offchainWithdrawal.routes");
const publicRoutes = require("./routes/public.routes");
// const midtransRoutes = require("./routes/midtrans.routes");
const paymentRoutes = require("./routes/payment.routes");
const superadminRoutes = require("./routes/superadmin.routes");
const adminPuraRoutes = require("./routes/adminpura");
const webhookRoutes = require("./routes/midtrans.routes");
const trusteeRoutes = require("./routes/trustee/withdraw.routes");

const app = express();

app.use(cors());
app.use(express.json());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

const leaderboardRoutes = require("./routes/leaderboard.routes");
const faqRoutes = require("./routes/faq.routes");
/**
 * AUTH
 */
app.use("/auth", authRoutes);

/**
 * PUBLIC
 */
app.use("/public", publicRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/reports", reportRoutes);




/**
 * ADMIN PURA (DASHBOARD)
 */
app.use("/adminpura", adminPuraRoutes);

/**
 * SUPERADMIN
 */
app.use("/superadmin", superadminRoutes);
app.use("/superadmin/offchain-withdrawals", offchainWithdrawalRoutes);
app.use("/trustee", trusteeRoutes);

/**
 * PAYMENT
 */
// app.use("/api/midtrans", midtransRoutes);
app.use("/api/payments", paymentRoutes);

app.use(express.json()); // ⬅️ WAJIB
app.use("/webhook", webhookRoutes);


/**
 * OPTIONAL: LISTENER (DEV / DEMO ONLY)
 */
// const startDonationListener = require(
//   "./blockchain/listeners/donationListener"
// );
// startDonationListener();

module.exports = app;
