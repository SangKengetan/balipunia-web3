const pool = require("../db/pool");

/**
 * SUPER ADMIN
 * List semua pencairan offchain
 */
async function getOffchainWithdrawals(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        id,
        nama_pura,
        amount,
        bank_name,
        rekening_number,
        rekening_name,
        status,
        note,
        created_at,
        updated_at
      FROM offchain_withdrawals
    `;

    const values = [];

    if (status) {
      query += ` WHERE status = $1`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, values);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data pencairan offchain",
    });
  }
}

/**
 * SUPER ADMIN
 * Update status pencairan offchain
 */
async function updateOffchainWithdrawalStatus(req, res) {
  try {
    const withdrawalId = req.params.id;
    const { status, note } = req.body;

    const allowedStatus = [
      "PENDING",
      "PROCESSING",
      "SUCCESS",
      "REJECTED",
    ];

    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid",
      });
    }

    const { rowCount, rows } = await pool.query(
      `
      UPDATE offchain_withdrawals
      SET
        status = $1,
        note = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [status, note || null, withdrawalId]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: "Data pencairan tidak ditemukan",
      });
    }

    res.json({
      message: "Status pencairan berhasil diperbarui",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal memperbarui status pencairan",
    });
  }
}

module.exports = {
  getOffchainWithdrawals,
  updateOffchainWithdrawalStatus,
};
