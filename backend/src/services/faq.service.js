const pool = require("../db/pool");

async function getAllFaqs() {
  const { rows } = await pool.query(`SELECT * FROM faqs ORDER BY created_at ASC`);
  return rows;
}

async function getFaqById(id) {
  const { rows } = await pool.query(`SELECT * FROM faqs WHERE id = $1`, [id]);
  return rows[0];
}

async function createFaq(data) {
  const { category, question, answer, is_active = true } = data;
  const { rows } = await pool.query(
    `INSERT INTO faqs (category, question, answer, is_active) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [category, question, answer, is_active]
  );
  return rows[0];
}

async function updateFaq(id, data) {
  const { category, question, answer, is_active } = data;
  const { rows } = await pool.query(
    `UPDATE faqs 
     SET category = $1, question = $2, answer = $3, is_active = $4 
     WHERE id = $5 RETURNING *`,
    [category, question, answer, is_active, id]
  );
  return rows[0];
}

async function deleteFaq(id) {
  await pool.query(`DELETE FROM faqs WHERE id = $1`, [id]);
}

module.exports = {
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};
