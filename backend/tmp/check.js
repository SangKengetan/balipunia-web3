const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'financial_reports';`)
  .then(res => { console.table(res.rows); pool.end(); })
  .catch(console.error);
