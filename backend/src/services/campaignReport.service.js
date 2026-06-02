const pool = require("../db/pool");
const { uploadToIPFS, uploadJSONToIPFS } = require("./ipfsService");

/**
 * Upload laporan kampanye bergaya "Social Media Post"
 * 
 * Alur IPFS JSON Metadata:
 * 1. Upload semua media files ke IPFS → dapatkan CID masing-masing
 * 2. Buat JSON metadata berisi description, financials, dan daftar CID media
 * 3. Upload JSON metadata ke IPFS → dapatkan Master CID
 * 4. Simpan Master CID di database (untuk di-anchor ke blockchain nanti)
 */
async function uploadCampaignReport({ adminPuraId, campaignId, files, description, totalIncome, totalExpense }) {
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

    // 🔒 Guard: campaign harus ACTIVE (ongoing) atau WITHDRAWN
    if (!["ACTIVE", "WITHDRAWN"].includes(campaign.status)) {
      throw new Error("CAMPAIGN_NOT_READY_FOR_REPORT");
    }

    // 2. Ambil withdraw request terakhir yang EXECUTED atau COMPLETED dan BELUM DILAPORKAN
    const { rows: wdRows } = await client.query(
      `
      SELECT *
      FROM withdraw_requests
      WHERE campaign_id = $1
        AND admin_pura_id = $2
        AND status IN ('EXECUTED', 'COMPLETED')
        AND id NOT IN (SELECT withdraw_request_id FROM campaign_reports WHERE campaign_id = $1)
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [campaignId, adminPuraId]
    );

    if (!wdRows.length) {
      throw new Error("NO_PENDING_WITHDRAWAL_TO_REPORT");
    }

    const withdrawRequest = wdRows[0];

    // ================================================================
    // 3. IPFS JSON Metadata Pattern
    // ================================================================

    // 3a. Upload setiap media file ke IPFS secara paralel
    const mediaFiles = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const cid = await uploadToIPFS(file);
        return {
          cid,
          file_name: file.originalname,
          mime_type: file.mimetype,
        };
      });
      const results = await Promise.all(uploadPromises);
      mediaFiles.push(...results);
    }

    // 3b. Buat objek JSON Metadata (Master Record)
    const metadataJson = {
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      description: description || "",
      total_income: parseFloat(totalIncome) || 0,
      total_expense: parseFloat(totalExpense) || 0,
      media: mediaFiles.map(m => ({
        cid: m.cid,
        file_name: m.file_name,
        mime_type: m.mime_type,
        ipfs_url: `ipfs://${m.cid}`,
      })),
      timestamp: new Date().toISOString(),
    };

    // 3c. Upload JSON Metadata ke IPFS → Master CID
    const metadataCid = await uploadJSONToIPFS(
      metadataJson,
      `report_${campaign.id}_${Date.now()}.json`
    );

    console.log(`📦 Master Metadata CID: ${metadataCid}`);

    // ================================================================
    // 4. Insert laporan campaign ke database
    // ================================================================
    const { rows } = await client.query(
      `
      INSERT INTO campaign_reports (
        admin_pura_id,
        campaign_id,
        withdraw_request_id,
        campaign_title,
        ipfs_cid,
        metadata_cid,
        description,
        media_files,
        file_name,
        mime_type,
        total_income,
        total_expense
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
      `,
      [
        adminPuraId,
        campaign.id,
        withdrawRequest.id,
        campaign.title,
        metadataCid,                              // ipfs_cid = Master CID (backward compat)
        metadataCid,                              // metadata_cid = Master CID
        description || "",                        // description
        JSON.stringify(mediaFiles),               // media_files (JSONB)
        mediaFiles[0]?.file_name || "metadata",   // file_name (first file or fallback)
        "application/json",                       // mime_type (metadata is JSON)
        totalIncome || 0,
        totalExpense || 0,
      ]
    );

    // 5. UPDATE STATUS CAMPAIGN → REPORTED (hanya jika campaign memiliki batas waktu / sebelumnya WITHDRAWN)
    // Jika ACTIVE (tanpa batas waktu), statusnya tetap ACTIVE
    if (campaign.status === "WITHDRAWN") {
      await client.query(
        `
        UPDATE campaigns
        SET status = 'REPORTED',
            updated_at = NOW()
        WHERE id = $1
        `,
        [campaign.id]
      );
    }

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

/**
 * List ALL campaign reports for a specific Admin Pura
 */
async function getAllCampaignReportsAdmin(adminPuraId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM campaign_reports
    WHERE admin_pura_id = $1
    ORDER BY created_at DESC
    `,
    [adminPuraId]
  );
  return rows;
}

/**
 * Dapatkan penarikan dana (withdraw request) terakhir yang belum dilaporkan
 */
async function getPendingWithdrawalForReport(campaignId, adminPuraId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM withdraw_requests
    WHERE campaign_id = $1
      AND admin_pura_id = $2
      AND status IN ('EXECUTED', 'COMPLETED')
      AND id NOT IN (SELECT withdraw_request_id FROM campaign_reports WHERE campaign_id = $1)
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [campaignId, adminPuraId]
  );

  return rows[0] || null;
}

module.exports = {
  uploadCampaignReport,
  getCampaignReports,
  getAllCampaignReportsAdmin,
  getPendingWithdrawalForReport,
};