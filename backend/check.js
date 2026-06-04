const pool = require('./src/db/pool');
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'offchain_transactions';")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
