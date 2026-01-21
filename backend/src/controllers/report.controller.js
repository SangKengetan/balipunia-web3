const fs = require("fs");
const pool = require("../db/pool");
const { uploadToIPFS } = require("../services/ipfsService");

/**
 * USER
 * Submit pengajuan admin pura
 */
async function uploadReport(req, res) {
  try {
    const {
      nama_pura,
      deskripsi,
      kontak_telepon,
      wallet_address,
      saldo_operasional
    } = req.body;

    const file = req.file;

    if (!file || !nama_pura || !kontak_telepon || !wallet_address || !saldo_operasional) {
      return res.status(400).json({
        message: "Nama pura, kontak, wallet address, saldo operasional, dan file wajib diisi",
      });
    }

    // Cek apakah masih ada PENDING
    const checkResult = await pool.query(
      `
      SELECT id FROM reports
      WHERE address_pengaju = $1 AND status = 'PENDING'
      LIMIT 1
      `,
      [wallet_address]
    );

    if (checkResult.rowCount > 0) {
      return res.status(409).json({
        message: "Anda masih memiliki pengajuan yang sedang diproses",
      });
    }

    const ipfsHash = await uploadToIPFS(file);

    const { rows } = await pool.query(
      `
      INSERT INTO reports
      (nama_pura, deskripsi, ipfs_hash, file_name, kontak_telepon, address_pengaju, saldo_operasional, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
      RETURNING *
      `,
      [
        nama_pura,
        deskripsi,
        ipfsHash,
        file.originalname,
        kontak_telepon,
        wallet_address,
        saldo_operasional
      ]
    );

    if (file?.path) fs.unlinkSync(file.path);

    res.status(201).json({
      message: "Pengajuan admin pura berhasil",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan saat upload pengajuan",
    });
  }
}

module.exports = {
  uploadReport,
};
