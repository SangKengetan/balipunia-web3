require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Starting migration...");

    // 1. Create donor_wallets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donor_wallets (
        id SERIAL PRIMARY KEY,
        donor_id INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL,
        label VARCHAR(50),
        linked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(donor_id, wallet_address)
      )
    `);
    console.log("Created donor_wallets table.");

    // 2. Migrate existing wallets from donors table
    const migrateResult = await pool.query(`
      INSERT INTO donor_wallets (donor_id, wallet_address, label)
      SELECT id, LOWER(wallet_address), 'Wallet Utama'
      FROM donors
      WHERE wallet_address IS NOT NULL AND wallet_address != ''
      ON CONFLICT DO NOTHING
    `);
    console.log(`Migrated ${migrateResult.rowCount} existing wallets.`);

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
