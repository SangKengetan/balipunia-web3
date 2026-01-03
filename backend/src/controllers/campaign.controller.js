const pool = require("../db/pool");

async function createCampaign(req, res) {
  try {
    console.log("ADMIN LOGGED IN:", req.admin);
    const admin = req.admin;

    const {
      title,
      description,
      purpose,
      deadline,
      is_onchain_enabled = true,
      is_offchain_enabled = true
    } = req.body;

    if (!title || !description || !purpose || !deadline) {
      return res.status(400).json({
        message: "title, description, purpose, dan deadline wajib diisi"
      });
    }

    const validPurpose = ["UPACARA_ADAT", "PEMBANGUNAN", "LAINNYA"];
    if (!validPurpose.includes(purpose)) {
      return res.status(400).json({ message: "Purpose tidak valid" });
    }

    // 🔍 cek admin_pura
    const getPuraQuery = `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`;
    const puraResult = await pool.query(getPuraQuery, [admin.id]);
    if (puraResult.rowCount === 0) {
      return res.status(403).json({ message: "Anda tidak terdaftar sebagai admin pura" });
    }
    const admin_pura_id = puraResult.rows[0].id;

    // 🆕 Generate onchain_campaign_id numeric berurutan
    const lastIdQuery = `SELECT MAX(onchain_campaign_id) AS max_id FROM campaigns`;
    const lastIdResult = await pool.query(lastIdQuery);
    const nextOnchainId = (lastIdResult.rows[0].max_id || 0) + 1;

    // 🟢 Insert campaign baru dengan onchain_campaign_id
    const insertQuery = `
      INSERT INTO campaigns (
        title,
        description,
        purpose,
        is_onchain_enabled,
        is_offchain_enabled,
        admin_pura_id,
        deadline,
        onchain_campaign_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;

    const values = [
      title,
      description,
      purpose,
      is_onchain_enabled,
      is_offchain_enabled,
      admin_pura_id,
      deadline,
      nextOnchainId
    ];

    const { rows } = await pool.query(insertQuery, values);

    res.status(201).json({
      message: "Campaign berhasil dibuat",
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat campaign" });
  }
}



async function getMyCampaigns(req, res) {
  try {
    const admin = req.admin;

    // ambil admin_pura.id berdasarkan admin.id (admins.id)
    const pura = await pool.query(
      `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
      [admin.id]
    );

    if (!pura.rows.length) {
      return res.status(403).json({ message: "Profil admin pura belum dibuat" });
    }

    const adminPuraId = pura.rows[0].id;

    const query = `
      SELECT
        id,
        title,
        description,
        purpose,
        is_onchain_enabled,
        is_offchain_enabled,
        status,
        onchain_campaign_id,
        created_at
      FROM campaigns
      WHERE admin_pura_id = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query, [adminPuraId]);

    res.status(200).json({
      message: "Daftar campaign admin berhasil diambil",
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil daftar campaign" });
  }
}


async function getCampaignById(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    const pura = await pool.query(
      `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
      [admin.id]
    );

    if (!pura.rows.length) {
      return res.status(403).json({ message: "Profil admin pura belum dibuat" });
    }

    const adminPuraId = pura.rows[0].id;

    const query = `
      SELECT
        id,
        title,
        description,
        purpose,
        is_onchain_enabled,
        is_offchain_enabled,
        status,
        onchain_campaign_id,
        created_at,
        updated_at
      FROM campaigns
      WHERE id = $1 AND admin_pura_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id, adminPuraId]);

    if (!rows.length) {
      return res.status(404).json({
        message: "Campaign tidak ditemukan atau bukan milik Anda"
      });
    }

    res.status(200).json({
      message: "Detail campaign admin",
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil detail campaign" });
  }
}


async function updateCampaign(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    const {
      title,
      description,
      purpose,
      status,
      is_onchain_enabled,
      is_offchain_enabled
    } = req.body;

    const validPurpose = ["UPACARA_ADAT", "PEMBANGUNAN", "LAINNYA"];
    if (purpose && !validPurpose.includes(purpose)) {
      return res.status(400).json({ message: "Purpose tidak valid" });
    }

    const validStatus = ["ACTIVE", "INACTIVE"];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    // 🔍 ambil admin_pura.id berdasarkan akun login
    const getPura = await pool.query(
      `SELECT id FROM admin_pura WHERE admin_id = $1 LIMIT 1`,
      [admin.id]
    );

    if (!getPura.rows.length) {
      return res.status(403).json({ message: "Profil admin pura belum dibuat" });
    }

    const adminPuraId = getPura.rows[0].id;

    // 🔎 cek apakah campaign milik admin pura ini
    const checkQuery = `
      SELECT id FROM campaigns
      WHERE id = $1 AND admin_pura_id = $2
      LIMIT 1
    `;
    const check = await pool.query(checkQuery, [id, adminPuraId]);

    if (!check.rows.length) {
      return res.status(404).json({
        message: "Campaign tidak ditemukan atau bukan milik Anda"
      });
    }

    // 🛠 update campaign
    const updateQuery = `
      UPDATE campaigns
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        purpose = COALESCE($3, purpose),
        status = COALESCE($4, status),
        is_onchain_enabled = COALESCE($5, is_onchain_enabled),
        is_offchain_enabled = COALESCE($6, is_offchain_enabled),
        updated_at = NOW()
      WHERE id = $7 AND admin_pura_id = $8
      RETURNING *
    `;

    const values = [
      title,
      description,
      purpose,
      status,
      is_onchain_enabled,
      is_offchain_enabled,
      id,
      adminPuraId
    ];

    const { rows } = await pool.query(updateQuery, values);

    res.status(200).json({
      message: "Campaign berhasil diperbarui",
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui campaign" });
  }
}



module.exports = {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
  updateCampaign
};