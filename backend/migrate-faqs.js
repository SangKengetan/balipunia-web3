const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const query = `
    CREATE TABLE IF NOT EXISTS faqs (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log("Creating faqs table...");
    await pool.query(query);
    console.log("Table faqs created successfully.");
  } catch (error) {
    console.error("Error creating faqs table:", error);
  } finally {
    await pool.end();
  }
}

migrate();
