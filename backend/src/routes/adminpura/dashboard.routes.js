const express = require("express");
const router = express.Router();

const {
  getAdminPuraDashboardSummaryHandler
} = require("../../controllers/adminpura/dashboard.controller");

const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/requireRole");

router.get(
  "/dashboard/summary",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  getAdminPuraDashboardSummaryHandler
);

module.exports = router;
