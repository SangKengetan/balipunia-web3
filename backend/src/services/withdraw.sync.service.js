const pool = require("../db/pool");
const votingService = require("./voting.service");

/**
 * Sync satu withdraw request by proposalId
 */
async function syncWithdrawByProposalId(proposalId) {
  const proposal = await votingService.getProposal(proposalId);

  if (!proposal.finalized) {
    return { status: "REQUESTED" };
  }

  if (proposal.executed) {
    await pool.query(
      `
      UPDATE withdraw_requests
      SET status = 'EXECUTED',
          updated_at = NOW()
      WHERE governance_proposal_id = $1
        AND status != 'EXECUTED'
      `,
      [proposalId]
    );

    return { status: "EXECUTED" };
  } else {
    await pool.query(
      `
      UPDATE withdraw_requests
      SET status = 'REJECTED',
          updated_at = NOW()
      WHERE governance_proposal_id = $1
        AND status != 'REJECTED'
      `,
      [proposalId]
    );

    return { status: "REJECTED" };
  }
}

/**
 * Sync SEMUA withdraw yang masih REQUESTED
 */
async function syncPendingWithdraws() {
  const { rows } = await pool.query(
    `
    SELECT governance_proposal_id
    FROM withdraw_requests
    WHERE status = 'REQUESTED'
      AND governance_proposal_id IS NOT NULL
    `
  );

  const results = [];

  for (const row of rows) {
    const result = await syncWithdrawByProposalId(
      row.governance_proposal_id
    );
    results.push({
      proposalId: row.governance_proposal_id,
      status: result.status,
    });
  }

  return results;
}

module.exports = {
  syncWithdrawByProposalId,
  syncPendingWithdraws,
};
