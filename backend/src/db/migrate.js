require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('./pool');

async function migrate() {
  try {
    console.log("Running migration...");
    await pool.query(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);`);
    await pool.query(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fund_mechanism VARCHAR(50);`);
    console.log("Migration successful: added image_url and fund_mechanism to campaigns.");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
