const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    await pool.query(`ALTER TABLE financial_reports ADD COLUMN IF NOT EXISTS media_files TEXT;`);
    console.log("Column media_files added/exists.");
    
    // Also add metadata_cid just in case
    await pool.query(`ALTER TABLE financial_reports ADD COLUMN IF NOT EXISTS metadata_cid VARCHAR(255);`);
    console.log("Column metadata_cid added/exists.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
