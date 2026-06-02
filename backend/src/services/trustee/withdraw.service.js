const pool = require("../../db/pool");

/**
 * TRUSTEE: set withdraw ready for voting
 */
async function setReadyForVoting(withdrawRequestId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM withdraw_requests
    WHERE id = $1
      AND status = 'REQUESTED'
    LIMIT 1
    `,
    [withdrawRequestId]
  );

  if (!rows.length) {
    throw new Error("WITHDRAW_NOT_IN_REQUESTED_STATE");
  }

  // Tidak update status
  return rows[0];
}


/**
 * TRUSTEE: mark voting started (AFTER frontend proposeWithdraw)
 */
async function markVotingStarted(withdrawRequestId, proposalId) {
  const { rowCount } = await pool.query(
    `
    UPDATE withdraw_requests
    SET status = 'VOTING_IN_PROGRESS',
        governance_proposal_id = $1,
        updated_at = NOW()
    WHERE id = $2
      AND status = 'REQUESTED'
    `,
    [proposalId, withdrawRequestId]
  );

  if (!rowCount) {
    throw new Error("WITHDRAW_NOT_READY_FOR_VOTING");
  }
}


async function getAllWithdrawsForTrustee() {
  const { rows } = await pool.query(`
    SELECT
      wr.id,
      wr.campaign_id,
      wr.onchain_campaign_id,
      wr.campaign_title,
      wr.amount_snapshot,
      wr.total_idr,
      wr.status,
      wr.ipfs_cid,
      wr.governance_proposal_id,
      wr.transfer_proof_cid,
      wr.created_at,

      c.campaign_type,
      c.deadline
    FROM withdraw_requests wr
    JOIN campaigns c ON c.id = wr.campaign_id
    ORDER BY wr.created_at DESC
  `);

  return rows;
}

/**
 * GET SINGLE WITHDRAW DETAIL (FOR TRUSTEE)
 */
async function getWithdrawDetailForTrustee(withdrawId) {
  const { rows } = await pool.query(
    `
    SELECT
      wr.*,
      c.campaign_type,
      c.deadline
    FROM withdraw_requests wr
    JOIN campaigns c ON c.id = wr.campaign_id
    WHERE wr.id = $1
    LIMIT 1
    `,
    [withdrawId]
  );

  if (!rows.length) {
    throw new Error("WITHDRAW_NOT_FOUND");
  }

  return rows[0];
}

module.exports = {
  setReadyForVoting,
  markVotingStarted, getAllWithdrawsForTrustee, getWithdrawDetailForTrustee
};
