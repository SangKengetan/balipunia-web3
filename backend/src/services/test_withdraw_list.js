require('dotenv').config({ path: '../../.env' });
const { getWithdrawRequestsByAdmin } = require('./withdraw.service');
const pool = require('../db/pool');

async function test() {
  try {
    const { rows } = await pool.query('SELECT id FROM admin_pura LIMIT 1');
    if (!rows.length) {
        console.log("No admin_pura found");
        return;
    }
    const adminPuraId = rows[0].id;
    console.log("Admin Pura ID:", adminPuraId);
    
    const data = await getWithdrawRequestsByAdmin(adminPuraId);
    console.log("Success data:", data);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit();
  }
}

test();
