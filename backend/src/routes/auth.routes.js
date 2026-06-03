const express = require("express");
const { adminAuth } = require("../controllers/auth.controller");
const { authenticateAdmin, authenticateDonor } = require("../middlewares/auth.middleware");
const {
  registerDonor,
  loginDonor,
  googleLoginDonor,
  getDonorProfile,
  addDonorWallet,
  getDonorWallets,
  removeDonorWallet
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
router.post("/donor/google", googleLoginDonor);
router.get("/donor/me", authenticateDonor, getDonorProfile);

router.get("/donor/wallets", authenticateDonor, getDonorWallets);
router.post("/donor/wallet", authenticateDonor, addDonorWallet);
// Support PUT as well just in case legacy frontend still uses it temporarily during transition
router.put("/donor/wallet", authenticateDonor, addDonorWallet); 
router.delete("/donor/wallet/:address", authenticateDonor, removeDonorWallet);

module.exports = router;
