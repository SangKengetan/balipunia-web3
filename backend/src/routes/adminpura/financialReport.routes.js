const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const { authenticateAdmin } = require("../../middlewares/auth.middleware");

const {
  createReport,
  listReports,
} = require("../../controllers/adminpura/financialReport.controller");

router.post(
  "/",
  authenticateAdmin,
  upload.single("file"),
  createReport
);

router.get(
  "/",
  authenticateAdmin,
  listReports
);

module.exports = router;
