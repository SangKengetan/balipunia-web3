const pool = require('./src/db/pool');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE offchain_transactions
      ADD COLUMN IF NOT EXISTS va_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMP
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
