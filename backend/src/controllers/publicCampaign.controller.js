const pool = require("../db/pool");


async function getPublicCampaigns(req, res) {
  try {
    const query = `
      SELECT
        c.id,
        c.onchain_campaign_id,
        c.title AS campaign_title,
        c.description,
        c.purpose,
        c.deadline,
        c.is_onchain_enabled,
        c.is_offchain_enabled,
        c.created_at,
        c.onchain_campaign_id,
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
        ap.kontak_pura,
        c.onchain_campaign_id
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

// controllers/campaignController.js
async function getCampaignDonations(req, res) {
  try {
    const { id } = req.params;

    // 1. ambil onchain_campaign_id dari UUID
    const campaignRes = await pool.query(
      `SELECT onchain_campaign_id FROM campaigns WHERE id = $1`,
      [id]
    );

    if (!campaignRes.rowCount) {
      return res.status(404).json({ message: "Campaign tidak ditemukan" });
    }

    const onchainId = campaignRes.rows[0].onchain_campaign_id;

    // 2. ambil history donasi
    const donations = await pool.query(
      `
      SELECT
        donor_address,
        token_address,
        amount,
        tx_hash,
        created_at
      FROM donations_onchain
      WHERE onchain_campaign_id = $1
      ORDER BY created_at DESC
      `,
      [onchainId]
    );

    res.json(donations.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data donasi" });
  }
}


module.exports = {
  getPublicCampaigns,
  getPublicCampaignDetail,
  getCampaignDonations,
};

