const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { OAuth2Client } = require("google-auth-library");

const JWT_EXPIRES = "7d";
const client = new OAuth2Client(); // We'll verify token without needing clientId directly here if passed correctly, or we can just expect it from env, but verifyIdToken needs audience

// 1. REGISTER DONOR
async function registerDonor(req, res) {
  try {
    const { email, password, name, contact } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    const checkEmail = await pool.query("SELECT id FROM donors WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO donors (email, password_hash, name, contact) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, contact`,
      [email, passwordHash, name, contact || null]
    );

    const donor = result.rows[0];
    donor.wallets = [];

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

    const result = await pool.query(
      "SELECT id, email, password_hash, name, contact FROM donors WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const donor = result.rows[0];
    if (!donor.password_hash) {
       return res.status(401).json({ message: "Invalid email or password. Perhaps you registered with Google?" });
    }

    const isMatch = await bcrypt.compare(password, donor.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Get wallets
    const walletsResult = await pool.query("SELECT wallet_address FROM donor_wallets WHERE donor_id = $1", [donor.id]);
    donor.wallets = walletsResult.rows.map(r => r.wallet_address);

    const token = jwt.sign(
      { id: donor.id, email: donor.email, role: "DONOR" },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

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

// 3. GOOGLE LOGIN DONOR
async function googleLoginDonor(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential is required" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) return res.status(400).json({ message: "Email not found in Google profile" });

    // Cek apakah donor sudah ada
    let result = await pool.query("SELECT id, email, name, contact FROM donors WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
    let donor;
    
    if (result.rowCount === 0) {
      // Auto register
      const insertResult = await pool.query(
        `INSERT INTO donors (email, name) VALUES ($1, $2) RETURNING id, email, name, contact`,
        [email, name]
      );
      donor = insertResult.rows[0];
      donor.wallets = [];
    } else {
      donor = result.rows[0];
      // Ambil wallets
      const walletsResult = await pool.query("SELECT wallet_address FROM donor_wallets WHERE donor_id = $1", [donor.id]);
      donor.wallets = walletsResult.rows.map(r => r.wallet_address);
    }

    const token = jwt.sign(
      { id: donor.id, email: donor.email, role: "DONOR" },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      message: "Google Login successful",
      token,
      donor,
    });

  } catch (err) {
    console.error("[GOOGLE LOGIN ERROR]", err);
    return res.status(500).json({ message: "Google Login failed" });
  }
}

// 4. GET PROFILE
async function getDonorProfile(req, res) {
  return res.json({ donor: req.donor });
}

// 5. ADD WALLET ADDRESS
async function addDonorWallet(req, res) {
  try {
    const { wallet_address } = req.body;
    if (!wallet_address) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const donorId = req.donor.id;

    // Cek batas 5 wallet
    const checkCount = await pool.query("SELECT COUNT(*) FROM donor_wallets WHERE donor_id = $1", [donorId]);
    if (parseInt(checkCount.rows[0].count) >= 5) {
      return res.status(400).json({ message: "Maksimal 5 wallet yang diizinkan per akun." });
    }

    // Cek apakah wallet sudah dipakai user lain
    const checkExist = await pool.query("SELECT donor_id FROM donor_wallets WHERE LOWER(wallet_address) = LOWER($1)", [wallet_address]);
    if (checkExist.rowCount > 0 && checkExist.rows[0].donor_id !== donorId) {
      return res.status(400).json({ message: "Wallet ini sudah terdaftar pada akun lain." });
    }

    await pool.query(
      "INSERT INTO donor_wallets (donor_id, wallet_address) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [donorId, wallet_address]
    );

    return res.json({
      message: "Wallet address added successfully",
      wallet_address,
    });
  } catch (err) {
    console.error("[ADD DONOR WALLET ERROR]", err);
    return res.status(500).json({ message: "Failed to add wallet address" });
  }
}

// 6. GET DONOR WALLETS
async function getDonorWallets(req, res) {
  try {
    const result = await pool.query("SELECT wallet_address FROM donor_wallets WHERE donor_id = $1", [req.donor.id]);
    return res.json({ wallets: result.rows.map(r => r.wallet_address) });
  } catch (err) {
    console.error("[GET DONOR WALLETS ERROR]", err);
    return res.status(500).json({ message: "Failed to get wallets" });
  }
}

// 7. REMOVE DONOR WALLET
async function removeDonorWallet(req, res) {
  try {
    const { address } = req.params;
    await pool.query("DELETE FROM donor_wallets WHERE donor_id = $1 AND LOWER(wallet_address) = LOWER($2)", [req.donor.id, address]);
    return res.json({ message: "Wallet removed successfully" });
  } catch (err) {
    console.error("[REMOVE DONOR WALLET ERROR]", err);
    return res.status(500).json({ message: "Failed to remove wallet" });
  }
}

module.exports = {
  registerDonor,
  loginDonor,
  googleLoginDonor,
  getDonorProfile,
  addDonorWallet,
  getDonorWallets,
  removeDonorWallet
};
