const express = require("express");
const router = express.Router();

const {
  getProfileHandler,
  updateProfileHandler
} = require("../../controllers/adminpura/profile.controller");

const { authenticateAdmin } = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/requireRole");

router.get(
  "/",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  getProfileHandler
);

router.put(
  "/",
  authenticateAdmin,
  requireRole("ADMIN_PURA"),
  updateProfileHandler
);

module.exports = router;
