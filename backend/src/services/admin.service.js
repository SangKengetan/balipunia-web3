const pool = require("../db/pool");

async function findAdminByAddress(address) {
  const query = `
    SELECT id, address, role, is_active, nonce
    FROM admins
    WHERE LOWER(address) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [address]);
  return rows[0];
}


async function updateAdminNonce(address, nonce) {
  await pool.query(
    "UPDATE admins SET nonce = $1 WHERE LOWER(address) = LOWER($2)",
    [nonce, address]
  );
}

async function clearAdminNonce(address) {
  await pool.query(
    "UPDATE admins SET nonce = NULL WHERE LOWER(address) = LOWER($1)",
    [address]
  );
}

module.exports = {
  findAdminByAddress,
  updateAdminNonce,
  clearAdminNonce,
};