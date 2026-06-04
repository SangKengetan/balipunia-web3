const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:skripsi@localhost:5432/balipunia?schema=public'
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' AND column_name = 'image_url';
    `);

    if (checkRes.rows.length === 0) {
      await client.query(`ALTER TABLE campaigns ADD COLUMN image_url VARCHAR(255);`);
      console.log("Added image_url column to campaigns table.");
    } else {
      console.log("image_url column already exists.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
