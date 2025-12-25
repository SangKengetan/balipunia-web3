const express = require('express');
const router = express.Router();

const {
  uploadReport,
  approveReport,
  rejectReport, getReports
} = require('../controllers/reportController');

const upload = require('../middlewares/upload');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole');


/**
 * USER BIASA

 */
router.post(
  '/submit',
  upload.single('file'),
  uploadReport
);

console.log("uploadReport:", uploadReport);
console.log("authMiddleware:", authenticateAdmin);
console.log("requireRole:", requireRole);
console.log("approveReport:", approveReport);


/**
 * SUPER ADMIN
 * Approve pengajuan
 */
router.post(
  '/:id/approve',
  authenticateAdmin,
  requireRole('SUPER_ADMIN'),
  approveReport
);

/**
 * SUPER ADMIN
 * Reject pengajuan
 */
router.post(
  '/:id/reject',
  authenticateAdmin,
  requireRole('SUPER_ADMIN'),
  rejectReport
);

router.get(
  '/',
  authenticateAdmin,
  requireRole('SUPER_ADMIN'),
  getReports
);


module.exports = router;
