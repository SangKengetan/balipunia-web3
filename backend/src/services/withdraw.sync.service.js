// services/withdraw.sync.service.js
const pool = require("../db/pool");
const votingService = require("./voting.service"); // backend blockchain reader

async function syncVotingResult(withdrawRequestId) {
  /* ===============================
     1. Ambil withdraw request
  =============================== */
  const { rows } = await pool.query(
    `
    SELECT
      wr.id,
      wr.governance_proposal_id,
      wr.campaign_id,
      wr.status
    FROM withdraw_requests wr
    WHERE wr.id = $1
    LIMIT 1
    `,
    [withdrawRequestId]
  );

  if (!rows.length) {
    throw new Error("WITHDRAW_NOT_FOUND");
  }

  const wr = rows[0];

  if (!wr.governance_proposal_id) {
    throw new Error("PROPOSAL_ID_NOT_FOUND");
  }

  /* ===============================
     2. Ambil proposal dari blockchain
  =============================== */
  const proposal = await votingService.getProposal(
    wr.governance_proposal_id
  );

  /**
   * status mapping dari VotingV3:
   * 0 = PENDING
   * 1 = APPROVED
   * 2 = REJECTED
   */
  let newWithdrawStatus = wr.status;
  let newCampaignStatus = null;

  if (proposal.status === "APPROVED" && proposal.executed) {
    newWithdrawStatus = "PENDING_TRANSFER";
    newCampaignStatus = "PENDING_TRANSFER";
  }

  if (proposal.status === "REJECTED") {
    newWithdrawStatus = "REJECTED";
    newCampaignStatus = "ACTIVE";
  }

  /* ===============================
     3. Jika belum berubah, STOP
  =============================== */
  if (newWithdrawStatus === wr.status) {
    return {
      updated: false,
      status: wr.status,
    };
  }

  /* ===============================
     4. Update withdraw_requests
  =============================== */
  await pool.query(
    `
    UPDATE withdraw_requests
    SET status = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
    [newWithdrawStatus, wr.id]
  );

  /* ===============================
     5. Update campaigns (jika perlu)
  =============================== */
  if (newCampaignStatus) {
    await pool.query(
      `
      UPDATE campaigns
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [newCampaignStatus, wr.campaign_id]
    );
  }

  return {
    updated: true,
    status: newWithdrawStatus,
    campaignStatus: newCampaignStatus,
  };
}

module.exports = {
  syncVotingResult,
};
