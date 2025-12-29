const pool = require("../db/pool");


async function getPublicCampaigns(req, res) {
  try {
    const query = `
      SELECT
        c.id,
        c.title AS campaign_title,
        c.description,
        c.purpose,
        c.deadline,
        c.is_onchain_enabled,
        c.is_offchain_enabled,
        c.created_at,
        ap.nama_pura
      FROM campaigns c
      JOIN admin_pura ap
        ON c.admin_pura_id = ap.id
      WHERE c.status = 'ACTIVE'
      ORDER BY c.created_at DESC
    `;

    const { rows } = await pool.query(query);

    res.status(200).json({
      message: "Public campaign list",
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil campaign publik",
    });
  }
}

async function getPublicCampaignDetail(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        c.id,
        c.title AS campaign_title,
        c.description,
        c.purpose,
        c.deadline,
        c.is_onchain_enabled,
        c.is_offchain_enabled,
        c.created_at,
        ap.nama_pura,
        ap.alamat_pura,
        ap.kontak_pura
      FROM campaigns c
      JOIN admin_pura ap
        ON c.admin_pura_id = ap.id
      WHERE c.id = $1
        AND c.status = 'ACTIVE'
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({
        message: "Campaign tidak ditemukan",
      });
    }

    res.status(200).json({
      message: "Detail campaign publik",
      data: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil detail campaign",
    });
  }
}


module.exports = {
  getPublicCampaigns,
  getPublicCampaignDetail,
};

