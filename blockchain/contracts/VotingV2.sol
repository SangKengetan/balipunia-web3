// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingV2 {
    struct Proposal {
        uint256 campaignKey;        // SC_ONLY: scCampaignId | HYBRID: hybridKey
        address adminPuraWallet;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 votesCount;
        bool finalized;
        bool executed;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event WithdrawProposed(
        uint256 indexed proposalId,
        uint256 indexed campaignKey,
        address adminPuraWallet
    );

    event Voted(
        uint256 indexed proposalId,
        address voter,
        bool support
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        bool approved
    );

    /* =========================
       EXISTING BEHAVIOR (KEEP)
    ========================= */

    function proposeWithdraw(
        uint256 campaignKey,
        address adminPuraWallet
    ) external returns (uint256) {
        proposalCount++;

        proposals[proposalCount] = Proposal({
            campaignKey: campaignKey,
            adminPuraWallet: adminPuraWallet,
            yesVotes: 0,
            noVotes: 0,
            votesCount: 0,
            finalized: false,
            executed: false
        });

        emit WithdrawProposed(
            proposalCount,
            campaignKey,
            adminPuraWallet
        );

        return proposalCount;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(!p.finalized, "FINALIZED");
        require(!hasVoted[proposalId][msg.sender], "ALREADY_VOTED");

        hasVoted[proposalId][msg.sender] = true;
        p.votesCount++;

        if (support) p.yesVotes++;
        else p.noVotes++;

        emit Voted(proposalId, msg.sender, support);
    }

    /* =========================
       ADDITIONS (NEW)
    ========================= */

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(!p.finalized, "ALREADY_FINALIZED");

        bool approved = p.yesVotes > p.noVotes;
        p.finalized = true;

        emit ProposalFinalized(proposalId, approved);
    }

    function markExecuted(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.finalized, "NOT_FINALIZED");
        require(!p.executed, "ALREADY_EXECUTED");

        p.executed = true;
    }

    /* =========================
       READ HELPERS (OPTIONAL)
    ========================= */

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 campaignKey,
            address adminPuraWallet,
            uint256 yesVotes,
            uint256 noVotes,
            uint256 votesCount,
            bool finalized,
            bool executed
        )
    {
        Proposal storage p = proposals[proposalId];
        return (
            p.campaignKey,
            p.adminPuraWallet,
            p.yesVotes,
            p.noVotes,
            p.votesCount,
            p.finalized,
            p.executed
        );
    }
}
