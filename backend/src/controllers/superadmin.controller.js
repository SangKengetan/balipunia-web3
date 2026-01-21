const pool = require("../db/pool");
const vault = require("../blockchain/vault.contract");
const { ownerSigner } = require("../blockchain/signer");


/**
 * SUPER ADMIN
 * List semua pengajuan
 */
async function getReports(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        id,
        nama_pura,
        deskripsi,
        kontak_telepon,
        address_pengaju,
        ipfs_hash,
        file_name,
        status,
        review_note,
        reviewed_by,
        reviewed_at,
        created_at
      FROM reports
    `;

    const values = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

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

/**
 * SUPER ADMIN
 * Approve pengajuan
 */
async function approveReport(req, res) {
  const client = await pool.connect();

  try {
    const reportId = req.params.id;
    const reviewerAddress = req.admin.address;

    await client.query("BEGIN");

    // =========================
    // 1️⃣ LOCK & AMBIL DATA REPORT
    // =========================
    const reportResult = await client.query(
      `
      SELECT
        id,
        nama_pura,
        kontak_telepon,
        address_pengaju,
        saldo_operasional
      FROM reports
      WHERE id = $1 AND status = 'PENDING'
      FOR UPDATE
      `,
      [reportId]
    );

    if (reportResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Pengajuan tidak ditemukan atau sudah diproses",
      });
    }

    const {
      nama_pura,
      kontak_telepon,
      address_pengaju,
      saldo_operasional,
    } = reportResult.rows[0];

    // =========================
    // 2️⃣ UPDATE STATUS REPORT
    // =========================
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

    // =========================
    // 3️⃣ CREATE / GET ADMIN
    // =========================
    let adminId;
    const adminCheck = await client.query(
      `SELECT id FROM admins WHERE address = $1 LIMIT 1`,
      [address_pengaju]
    );

    if (adminCheck.rowCount === 0) {
      const insertAdmin = await client.query(
        `
        INSERT INTO admins (address, role, is_active)
        VALUES ($1, 'ADMIN_PURA', true)
        RETURNING id
        `,
        [address_pengaju]
      );
      adminId = insertAdmin.rows[0].id;
    } else {
      adminId = adminCheck.rows[0].id;
    }

    // =========================
    // 4️⃣ INSERT / UPDATE admin_pura
    // =========================
    const puraCheck = await client.query(
      `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
      [adminId]
    );

    if (puraCheck.rowCount === 0) {
      await client.query(
        `
        INSERT INTO admin_pura (
          admin_id,
          nama_pura,
          kontak_pura,
          wallet_address,
          saldo_operasional,
          onchain_registered
        )
        VALUES ($1, $2, $3, $4, $5, false)
        `,
        [
          adminId,
          nama_pura,
          kontak_telepon,
          address_pengaju,
          saldo_operasional || 0,
        ]
      );
    } else {
      await client.query(
        `
        UPDATE admin_pura
        SET
          nama_pura = $1,
          kontak_pura = $2,
          wallet_address = $3,
          saldo_operasional = $4
        WHERE admin_id = $5
        `,
        [
          nama_pura,
          kontak_telepon,
          address_pengaju,
          saldo_operasional || 0,
          adminId,
        ]
      );
    }

    // =========================
    // 5️⃣ COMMIT DB
    // =========================
    await client.query("COMMIT");

    // =========================
    // 6️⃣ REGISTER ADMIN PURA ON-CHAIN
    // =========================
    let onchainRegistered = false;

    try {
      const tx = await vault
        .connect(ownerSigner)
        .addAdminPura(address_pengaju);

      await tx.wait();
      onchainRegistered = true;

      await pool.query(
        `
        UPDATE admin_pura
        SET onchain_registered = true
        WHERE wallet_address = $1
        `,
        [address_pengaju]
      );
    } catch (chainError) {
      console.error("❌ On-chain register failed:", chainError.message);
    }

    // =========================
    // 7️⃣ RESPONSE
    // =========================
    res.json({
      message: "Pengajuan disetujui & admin pura berhasil dibuat",
      nama_pura,
      wallet_address: address_pengaju,
      saldo_operasional,
      onchain_registered: onchainRegistered,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("APPROVE REPORT ERROR:", error);
    res.status(500).json({ message: "Gagal memproses persetujuan" });
  } finally {
    client.release();
  }
}


/**
 * SUPER ADMIN
 * Reject pengajuan
 */
async function rejectReport(req, res) {
  try {
    const { note } = req.body;
    const reportId = req.params.id;
    const reviewerAddress = req.admin.address;

    const { rowCount, rows } = await pool.query(
      `
      UPDATE reports
      SET status = 'REJECTED',
          reviewed_by = $1,
          reviewed_at = NOW(),
          review_note = $2
      WHERE id = $3 AND status = 'PENDING'
      RETURNING *
      `,
      [
        reviewerAddress,
        note || "Ditolak oleh Super Admin",
        reportId,
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: "Laporan tidak ditemukan atau sudah diproses",
      });
    }

    res.json({
      message: "Pengajuan ditolak",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal reject pengajuan",
    });
  }
}

/**
 * SUPER ADMIN
 * Dashboard summary
 */
async function getDashboardSummary(req, res) {
  try {
    /**
     * 1. Ringkasan admin berdasarkan role
     */
    const adminSummaryQuery = `
      SELECT role, COUNT(*)::int AS total
      FROM admins
      GROUP BY role
    `;

    /**
     * 2. Ringkasan pengajuan berdasarkan status
     */
    const reportSummaryQuery = `
      SELECT status, COUNT(*)::int AS total
      FROM reports
      GROUP BY status
    `;

    /**
     * 3. Pengajuan terbaru (limit 5)
     */
    const latestReportsQuery = `
      SELECT
        id,
        nama_pura,
        status,
        address_pengaju,
        created_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [
      adminSummaryResult,
      reportSummaryResult,
      latestReportsResult,
    ] = await Promise.all([
      pool.query(adminSummaryQuery),
      pool.query(reportSummaryQuery),
      pool.query(latestReportsQuery),
    ]);

    /**
     * Mapping admin summary
     */
    const adminSummary = {
      SUPER_ADMIN: 0,
      ADMIN_PURA: 0,
      TRUSTEE: 0,
    };

    adminSummaryResult.rows.forEach((row) => {
      adminSummary[row.role] = row.total;
    });

    /**
     * Mapping report summary
     */
    const reportSummary = {
      TOTAL: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    reportSummaryResult.rows.forEach((row) => {
      reportSummary[row.status] = row.total;
      reportSummary.TOTAL += row.total;
    });

    res.json({
      admin_summary: adminSummary,
      report_summary: reportSummary,
      latest_reports: latestReportsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil dashboard summary",
    });
  }
}

/**
 * SUPER ADMIN
 * List semua admin
 */
async function listAdmins(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        address,
        role,
        is_active,
        created_at
      FROM admins
      ORDER BY created_at DESC
    `);

    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data admin",
    });
  }
}

/**
 * SUPER ADMIN
 * Create admin
 */
async function createAdmin(req, res) {
  try {
    const { address, role } = req.body;

    const allowedRoles = ["SUPER_ADMIN", "ADMIN_PURA", "TRUSTEE"];

    if (!address || !role) {
      return res.status(400).json({
        message: "Address dan role wajib diisi",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Role tidak valid",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM admins WHERE address = $1`,
      [address]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        message: "Admin dengan address ini sudah terdaftar",
      });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO admins (address, role, is_active)
      VALUES ($1, $2, true)
      RETURNING id, address, role, is_active, created_at
      `,
      [address, role]
    );

    res.status(201).json({
      message: "Admin berhasil dibuat",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal membuat admin",
    });
  }
}

/**
 * SUPER ADMIN
 * Toggle admin active status
 */
async function toggleAdmin(req, res) {
  try {
    const adminId = req.params.id;

    const { rowCount, rows } = await pool.query(
      `
      UPDATE admins
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, address, role, is_active
      `,
      [adminId]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    res.json({
      message: "Status admin berhasil diperbarui",
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengubah status admin",
    });
  }
}

/**
 * SUPER ADMIN
 * Delete admin
 */
async function deleteAdmin(req, res) {
  try {
    const adminId = req.params.id;

    // Cegah hapus diri sendiri
    if (Number(adminId) === req.admin.id) {
      return res.status(400).json({
        message: "Tidak dapat menghapus akun sendiri",
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM admins WHERE id = $1`,
      [adminId]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        message: "Admin tidak ditemukan",
      });
    }

    res.json({
      message: "Admin berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal menghapus admin",
    });
  }
}



module.exports = {
  getReports,  approveReport, rejectReport, 
  getDashboardSummary, 
  listAdmins, createAdmin, toggleAdmin, deleteAdmin
};
