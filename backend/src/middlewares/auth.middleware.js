const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 JOIN admins + admin_pura
    const result = await pool.query(
      `
      SELECT
        a.id           AS admin_id,
        a.address,
        a.role,
        a.is_active,
        ap.id          AS admin_pura_id,
        ap.wallet_address
      FROM admins a
      LEFT JOIN admin_pura ap ON ap.admin_id = a.id
      WHERE a.id = $1
      LIMIT 1
      `,
      [decoded.id]
    );
    

    if (result.rowCount === 0 || !result.rows[0].is_active) {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    // ✅ STRUCTURE YANG KONSISTEN & AMAN
    req.admin = {
      id: result.rows[0].admin_id,          // admins.id
      role: result.rows[0].role,
      address: result.rows[0].address,
      admin_pura_id: result.rows[0].admin_pura_id, // admin_pura.id (bisa null)
      wallet_address: result.rows[0].wallet_address,
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
}

async function authenticateDonor(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "DONOR") {
      return res.status(403).json({ message: "Not authorized as donor" });
    }

    const result = await pool.query(
      `
      SELECT id, email, name, contact
      FROM donors 
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: "Donor not found" });
    }

    const walletsResult = await pool.query(
      "SELECT wallet_address FROM donor_wallets WHERE donor_id = $1",
      [decoded.id]
    );

    req.donor = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      contact: result.rows[0].contact,
      wallets: walletsResult.rows.map(r => r.wallet_address),
    };

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  authenticateAdmin,
  authenticateDonor,
};
