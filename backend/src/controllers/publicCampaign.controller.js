const pool = require("../db/pool");

async function getPublicCampaigns(req, res) {
  try {
    const query = `
      SELECT
        id,
        title,
        description,
        purpose,
        is_onchain_enabled,
        is_offchain_enabled,
        created_at
      FROM campaigns
      WHERE status = 'ACTIVE'
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query);

    res.status(200).json({
      message: "Daftar campaign publik",
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil campaign publik"
    });
  }
}

async function getPublicCampaignDetail(req, res) {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        title,
        description,
        purpose,
        is_onchain_enabled,
        is_offchain_enabled,
        status,
        created_at
      FROM campaigns
      WHERE id = $1
        AND status = 'ACTIVE'
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({
        message: "Campaign tidak ditemukan"
      });
    }

    res.status(200).json({
      message: "Detail campaign publik",
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil detail campaign"
    });
  }
}

module.exports = {
  getPublicCampaigns,
  getPublicCampaignDetail
};
