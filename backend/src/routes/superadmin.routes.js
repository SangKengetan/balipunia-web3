const express = require("express");
const router = express.Router();

const { authenticateAdmin } = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/requireRole");
const upload = require("../middlewares/upload");

const {
  getReports,  approveReport,  rejectReport,
  getDashboardSummary,
  listAdmins, createAdmin, toggleAdmin, deleteAdmin
} = require("../controllers/superAdmin.controller");

const {
  listWithdrawTransfers,
  completeTransfer,
} = require("../controllers/superadmin/withdraw.controller");

router.use(authenticateAdmin, requireRole("SUPER_ADMIN"));

router.get("/reports", getReports);
router.get("/dashboard/summary", getDashboardSummary);
router.post("/reports/:id/approve", approveReport);
router.post("/reports/:id/reject", rejectReport);

router.get("/admins", listAdmins);
router.post("/admins", createAdmin);
router.patch("/admins/:id/toggle", toggleAdmin);
router.delete("/admins/:id", deleteAdmin);

// Pencairan Dana (Withdraw Transfers)
router.get("/withdraws", listWithdrawTransfers);
router.post(
  "/withdraws/:id/transfer",
  upload.single("transfer_proof"),
  completeTransfer
);


module.exports = router;

