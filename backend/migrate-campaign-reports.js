const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const query = `
    ALTER TABLE campaign_reports
    ADD COLUMN IF NOT EXISTS income_system NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS income_outside NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS income_peturunan NUMERIC DEFAULT 0;
  `;

  try {
    console.log("Migrating campaign_reports table...");
    await pool.query(query);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Error migrating table:", error);
  } finally {
    await pool.end();
  }
}

migrate();
