require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('../src/db/pool');

async function check() {
  try {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns';`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
