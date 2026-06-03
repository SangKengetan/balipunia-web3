const pool = require("./db/pool");
require("dotenv").config();

async function test() {
  try {
    const res = await pool.query("SELECT 1 as val");
    console.log("DB connected successfully", res.rows);
    process.exit(0);
  } catch (err) {
    console.error("Failed to connect:", err);
    process.exit(1);
  }
}
test();
