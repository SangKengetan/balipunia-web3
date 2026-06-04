const pool = require("../../db/pool");

/**
 * SUPER ADMIN: Get all withdraw requests pending transfer
 * Menampilkan semua permintaan pencairan yang sudah disetujui voting
 * dan menunggu Super Admin mentransfer dana ke rekening Admin Pura.
 */
async function getPendingTransfers() {
  const { rows } = await pool.query(`
    SELECT
      wr.id,
      wr.campaign_id,
      wr.onchain_campaign_id,
      wr.campaign_title,
      wr.amount_snapshot,
      wr.total_idr,
      wr.wallet_address,
      wr.reason,
      wr.ipfs_cid,
      wr.governance_proposal_id,
      wr.status,
      wr.transfer_proof_cid,
      wr.transferred_at,
      wr.created_at,
      wr.updated_at,

      ap.nama_pura,
      ap.kontak_pura,
      ap.bank_name,
      ap.bank_account_number,
      ap.bank_account_name,

      c.campaign_type,
      c.deadline
    FROM withdraw_requests wr
    JOIN admin_pura ap ON ap.id = wr.admin_pura_id
    JOIN campaigns c ON c.id = wr.campaign_id
    ORDER BY
      CASE wr.status
        WHEN 'PENDING_TRANSFER' THEN 0
        WHEN 'COMPLETED' THEN 1
        ELSE 2
      END,
      wr.updated_at DESC
  `);

  return rows;
}

/**
 * SUPER ADMIN: Complete transfer — upload bukti transfer
 * Mengubah status dari PENDING_TRANSFER → COMPLETED
 */
async function completeTransfer({
  withdrawRequestId,
  transferProofCid,
  adminId,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Ambil withdraw request dan info deadline campaign
    const { rows } = await client.query(
      `
      SELECT wr.id, wr.campaign_id, wr.admin_pura_id, wr.campaign_title, wr.status, wr.amount_snapshot, c.deadline
      FROM withdraw_requests wr
      JOIN campaigns c ON c.id = wr.campaign_id
      WHERE wr.id = $1
      FOR UPDATE
      `,
      [withdrawRequestId]
    );

    if (!rows.length) {
      throw new Error("WITHDRAW_NOT_FOUND");
    }

    const wr = rows[0];

    if (wr.status !== "PENDING_TRANSFER") {
      throw new Error("WITHDRAW_NOT_PENDING_TRANSFER");
    }

    // 2. Update withdraw_requests → COMPLETED
    await client.query(
      `
      UPDATE withdraw_requests
      SET status = 'COMPLETED',
          transfer_proof_cid = $1,
          transferred_at = NOW(),
          transferred_by = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [transferProofCid, adminId, withdrawRequestId]
    );

    const newCampaignStatus = wr.deadline ? 'WITHDRAWN' : 'ACTIVE';
    await client.query(
      `
      UPDATE campaigns
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [newCampaignStatus, wr.campaign_id]
    );

    // 4. Jika withdraw bertipe UNIFIED (ada unified_lpj di amount_snapshot), buat laporan otomatis
    let snapshot = {};
    try {
      snapshot = typeof wr.amount_snapshot === 'string' ? JSON.parse(wr.amount_snapshot) : wr.amount_snapshot;
    } catch (e) {}

    if (snapshot.unified_lpj) {
      const lpj = snapshot.unified_lpj;
      await client.query(
        `
        INSERT INTO campaign_reports (
          admin_pura_id, campaign_id, withdraw_request_id, campaign_title,
          ipfs_cid, metadata_cid, description, media_files, file_name, mime_type,
          total_income, income_system, income_outside, income_peturunan, total_expense
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        `,
        [
          wr.admin_pura_id, wr.campaign_id, wr.id, wr.campaign_title,
          lpj.metadata_cid, lpj.metadata_cid, lpj.description,
          JSON.stringify(lpj.media_files || []), (lpj.media_files && lpj.media_files[0]?.file_name) || "metadata", "application/json",
          lpj.total_income || 0, lpj.income_system || 0, lpj.income_outside || 0, lpj.income_peturunan || 0, lpj.total_expense || 0
        ]
      );
    }

    await client.query("COMMIT");

    return {
      withdrawRequestId,
      status: "COMPLETED",
      transferProofCid,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getPendingTransfers,
  completeTransfer,
};
