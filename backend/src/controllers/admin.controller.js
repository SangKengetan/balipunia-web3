const jwt = require("jsonwebtoken");
const { findAdminByAddress } = require("../services/admin.service");

async function adminAuth(req, res) {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Address is required" });
  }

  const admin = await findAdminByAddress(address);

  if (!admin || !admin.is_active) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const token = jwt.sign(
    { address: admin.address, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    address: admin.address,
    role: admin.role,
    token,
  });
}

const crypto = require("crypto");
const { ethers } = require("ethers");
const {
  updateAdminNonce,
  clearAdminNonce,
} = require("../services/admin.service");

// 1️⃣ request nonce
async function requestNonce(req, res) {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Address required" });
  }

  const admin = await findAdminByAddress(address);

  if (!admin || !admin.is_active) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  await updateAdminNonce(address, nonce);

  res.json({ nonce });
}

// 2️⃣ verify signature
async function verifySignature(req, res) {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const admin = await findAdminByAddress(address);

  if (!admin || !admin.nonce) {
    return res.status(403).json({ message: "Invalid nonce" });
  }

  const message = `Login admin punia: ${admin.nonce}`;
  const recovered = ethers.verifyMessage(message, signature);

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  await clearAdminNonce(address);

  const token = jwt.sign(
    { address: admin.address, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    address: admin.address,
    role: admin.role,
    token,
  });
}

module.exports = {
  adminAuth,
  requestNonce,
  verifySignature,
};
