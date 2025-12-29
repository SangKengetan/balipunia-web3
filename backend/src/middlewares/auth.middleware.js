const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validasi admin di database
    const result = await pool.query(
      "SELECT id, address, role, is_active FROM admins WHERE id = $1 LIMIT 1",
      [decoded.id]
    );

    // Jika admin tidak ada atau dinonaktifkan
    if (result.rowCount === 0 || !result.rows[0].is_active) {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    // Simpan admin ke req untuk digunakan di controller
    req.admin = result.rows[0];

    next();

  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  authenticateAdmin,
};
