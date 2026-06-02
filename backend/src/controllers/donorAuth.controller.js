const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

// JWT Expiration: 7 days for donors to keep them logged in longer
const JWT_EXPIRES = "7d";

// 1. REGISTER DONOR
async function registerDonor(req, res) {
  try {
    const { email, password, name, contact } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // Check if email already registered
    const checkEmail = await pool.query("SELECT id FROM donors WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert donor
    const result = await pool.query(
      `INSERT INTO donors (email, password_hash, name, contact) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, contact, wallet_address`,
      [email, passwordHash, name, contact || null]
    );

    const donor = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: donor.id, email: donor.email, role: "DONOR" },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      message: "Donor registered successfully",
      token,
      donor,
    });
  } catch (err) {
    console.error("[REGISTER DONOR ERROR]", err);
    return res.status(500).json({ message: "Registration failed" });
  }
}

// 2. LOGIN DONOR
async function loginDonor(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find donor
    const result = await pool.query(
      "SELECT id, email, password_hash, name, contact, wallet_address FROM donors WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const donor = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, donor.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: donor.id, email: donor.email, role: "DONOR" },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Clean up sensitive fields before returning
    delete donor.password_hash;

    return res.json({
      message: "Login successful",
      token,
      donor,
    });
  } catch (err) {
    console.error("[LOGIN DONOR ERROR]", err);
    return res.status(500).json({ message: "Login failed" });
  }
}

// 3. GET PROFILE
async function getDonorProfile(req, res) {
  // req.donor is populated by authenticateDonor middleware
  return res.json({ donor: req.donor });
}

// 4. UPDATE WALLET ADDRESS
async function updateDonorWallet(req, res) {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    await pool.query(
      "UPDATE donors SET wallet_address = $1 WHERE id = $2",
      [wallet_address, req.donor.id]
    );

    return res.json({
      message: "Wallet address updated successfully",
      wallet_address,
    });
  } catch (err) {
    console.error("[UPDATE DONOR WALLET ERROR]", err);
    return res.status(500).json({ message: "Failed to update wallet address" });
  }
}

module.exports = {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonorWallet,
};
