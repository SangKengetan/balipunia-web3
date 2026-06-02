const express = require("express");
const { adminAuth } = require("../controllers/auth.controller");
const { authenticateAdmin, authenticateDonor } = require("../middlewares/auth.middleware");
const {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorWallet,
} = require("../controllers/donorAuth.controller");

const {
  requestNonce,
  verifySignature,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/auth", adminAuth); // legacy / optional
router.post("/nonce", requestNonce);
router.post("/verify", verifySignature);

router.get("/me", authenticateAdmin, (req, res) => {
  res.json({
    id: req.admin.id,
    address: req.admin.address,
    role: req.admin.role,
  });
});

// === DONOR ROUTES ===
router.post("/donor/register", registerDonor);
router.post("/donor/login", loginDonor);
router.get("/donor/me", authenticateDonor, getDonorProfile);
router.put("/donor/wallet", authenticateDonor, updateDonorWallet);

module.exports = router;
