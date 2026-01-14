const pool = require("../db/pool");
const { uploadToIPFS } = require("./ipfsService");

/**
 * Upload laporan kampanye
 * Melakukan validasi bisnis (campaign exists, WD executed) sebelum upload.
 */
async function uploadCampaignReport({ adminPuraId, campaignId, file }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Validasi campaign
    const { rows: campaignRows } = await client.query(
      `
      SELECT *
      FROM campaigns
      WHERE id = $1 AND admin_pura_id = $2
      LIMIT 1
      `,
      [campaignId, adminPuraId]
    );

    if (!campaignRows.length) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }

    const campaign = campaignRows[0];

    // 🔒 Guard tambahan (opsional tapi disarankan)
    if (campaign.status !== "WITHDRAWN") {
      throw new Error("CAMPAIGN_NOT_WITHDRAWN");
    }

    // 2. Ambil withdraw request terakhir yang EXECUTED
    const { rows: wdRows } = await client.query(
      `
      SELECT *
      FROM withdraw_requests
      WHERE campaign_id = $1
        AND admin_pura_id = $2
        AND status = 'EXECUTED'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [campaignId, adminPuraId]
    );

    if (!wdRows.length) {
      throw new Error("NO_EXECUTED_WD");
    }

    const withdrawRequest = wdRows[0];

    // 3. Upload ke IPFS
    const cid = await uploadToIPFS(file);

    // 4. Insert laporan campaign
    const { rows } = await client.query(
      `
      INSERT INTO campaign_reports (
        admin_pura_id,
        campaign_id,
        withdraw_request_id,
        campaign_title,
        ipfs_cid,
        file_name,
        mime_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING *
      `,
      [
        adminPuraId,
        campaign.id,
        withdrawRequest.id,
        campaign.title,
        cid,
        file.originalname,
        file.mimetype,
      ]
    );

    // 5️⃣ UPDATE STATUS CAMPAIGN → REPORTED
    await client.query(
      `
      UPDATE campaigns
      SET status = 'REPORTED',
          updated_at = NOW()
      WHERE id = $1
      `,
      [campaign.id]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List laporan per campaign
 */
async function getCampaignReports(campaignId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM campaign_reports
    WHERE campaign_id = $1
    ORDER BY created_at DESC
    `,
    [campaignId]
  );

  return rows;
}

module.exports = {
  uploadCampaignReport,
  getCampaignReports,
};