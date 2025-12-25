const fs = require('fs');
const pool = require('../db/pool');
const { uploadToIPFS } = require('../services/ipfsService');

async function uploadReport(req, res) {
  try {
    const {
      nama_pura,
      deskripsi,
      kontak_telepon,
      wallet_address
    } = req.body;

    const file = req.file;

    if (!file || !nama_pura || !kontak_telepon || !wallet_address) {
      return res.status(400).json({
        message: 'Nama pura, kontak, wallet address, dan file wajib diisi'
      });
    }

    // Cek apakah wallet sudah punya pengajuan PENDING
    const checkQuery = `
      SELECT id FROM reports
      WHERE address_pengaju = $1 AND status = 'PENDING'
      LIMIT 1
    `;

    const checkResult = await pool.query(checkQuery, [wallet_address]);

    if (checkResult.rowCount > 0) {
      return res.status(409).json({
        message: 'Anda masih memiliki pengajuan yang sedang diproses'
      });
    }

    const ipfsHash = await uploadToIPFS(file);

    const query = `
      INSERT INTO reports
      (nama_pura, deskripsi, ipfs_hash, file_name, kontak_telepon, address_pengaju, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
      RETURNING *
    `;

    const values = [
      nama_pura,
      deskripsi,
      ipfsHash,
      file.originalname,
      kontak_telepon,
      wallet_address
    ];

    const { rows } = await pool.query(query, values);

    if (file?.path) {
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      message: 'Pengajuan admin pura berhasil',
      data: rows[0]
    });

  } catch (error) {
    // Duplicate key (unique index violation)
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Pengajuan dengan wallet ini masih dalam status PENDING'
      });
    }
    console.error(error);
    res.status(500).json({
      message: 'Terjadi kesalahan saat upload pengajuan'
    });
  }
}


async function approveReport(req, res) {
  const client = await pool.connect();

  try {
    const reportId = req.params.id;
    const reviewerAddress = req.admin.wallet_address;

    await client.query('BEGIN');

    // 1. Ambil data laporan (PASTI PENDING)
    const reportQuery = `
      SELECT address_pengaju
      FROM reports
      WHERE id = $1 AND status = 'PENDING'
      FOR UPDATE
    `;
    const reportResult = await client.query(reportQuery, [reportId]);

    if (reportResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: 'Pengajuan tidak ditemukan atau sudah diproses'
      });
    }

    const addressPengaju = reportResult.rows[0].address_pengaju;

    // 2. Update status laporan
    await client.query(
      `
      UPDATE reports
      SET status = 'APPROVED',
          reviewed_by = $1,
          reviewed_at = NOW()
      WHERE id = $2
      `,
      [reviewerAddress, reportId]
    );

    // 3. Cek apakah sudah jadi admin (safety)
    const adminCheck = await client.query(
      `SELECT id FROM admins WHERE wallet_address = $1`,
      [addressPengaju]
    );

    if (adminCheck.rowCount === 0) {
      // 4. Insert ADMIN_PURA
      await client.query(
        `
        INSERT INTO admins (wallet_address, role, is_active)
        VALUES ($1, 'ADMIN_PURA', true)
        `,
        [addressPengaju]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: 'Pengajuan disetujui, admin pura berhasil dibuat',
      wallet_address: addressPengaju
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);

    res.status(500).json({
      message: 'Gagal memproses persetujuan'
    });
  } finally {
    client.release();
  }
}


async function rejectReport(req, res) {
  try {
    const { note } = req.body;
    const reportId = req.params.id;
    const reviewerAddress = req.admin.wallet_address;

    const query = `
      UPDATE reports
      SET status = 'REJECTED',
          reviewed_by = $1,
          reviewed_at = NOW(),
          review_note = $2
      WHERE id = $3 AND status = 'PENDING'
      RETURNING *
    `;

    const { rowCount, rows } = await pool.query(query, [
      reviewerAddress,
      note || 'Ditolak oleh Super Admin',
      reportId
    ]);

    if (rowCount === 0) {
      return res.status(404).json({
        message: 'Laporan tidak ditemukan atau sudah diproses'
      });
    }

    res.json({
      message: 'Pengajuan ditolak',
      data: rows[0]
    });

  } catch (err) {
    res.status(500).json({ message: 'Gagal reject laporan' });
  }
}

async function getReports(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        r.id,
        r.nama_pura,
        r.deskripsi,
        r.kontak_telepon,
        r.address_pengaju,
        r.ipfs_hash,
        r.file_name,
        r.status,
        r.review_note,
        r.reviewed_by,
        r.reviewed_at,
        r.created_at
      FROM reports r
    `;

    const values = [];

    // Jika status dikirim → filter
    if (status) {
      query += ` WHERE r.status = $1`;
      values.push(status);
    }

    query += ` ORDER BY r.created_at DESC`;

    const { rows } = await pool.query(query, values);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data pengajuan",
    });
  }
}

module.exports = {
  uploadReport,
  approveReport,
  rejectReport,
  getReports,
};