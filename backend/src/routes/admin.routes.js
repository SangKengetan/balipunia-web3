const express = require("express");
const { adminAuth } = require("../controllers/admin.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");

const {
  requestNonce,
  verifySignature,
} = require("../controllers/admin.controller");

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

module.exports = router;
