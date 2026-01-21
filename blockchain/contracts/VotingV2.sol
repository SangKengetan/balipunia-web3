// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*//////////////////////////////////////////////////////////////
                        INTERFACE
//////////////////////////////////////////////////////////////*/
interface IDonationVaultV4 {
    function executeWithdrawScOnly(uint256 campaignId) external;
}

/*//////////////////////////////////////////////////////////////
                            VOTING
//////////////////////////////////////////////////////////////*/
contract VotingV2 {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotTrustee();
    error InvalidProposal();
    error AlreadyVoted();
    error ProposalAlreadyFinalized();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event WithdrawProposed(
        uint256 indexed proposalId,
        uint256 indexed campaignId
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed trustee,
        bool support
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        bool approved
    );

    event WithdrawExecuted(
        uint256 indexed proposalId,
        uint256 indexed campaignId
    );

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/
    IDonationVaultV4 public immutable donationVault;

    address[3] public trustees;
    mapping(address => bool) public isTrustee;

    uint256 public proposalCount;

    enum ProposalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    struct Proposal {
        uint256 campaignId;

        uint8 yesVotes;
        uint8 noVotes;
        uint8 votesCount;

        ProposalStatus status;
        bool executed;

        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) private proposals;

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyTrustee() {
        if (!isTrustee[msg.sender]) revert NotTrustee();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _donationVault,
        address[3] memory _trustees
    ) {
        require(_donationVault != address(0), "Invalid vault address");

        donationVault = IDonationVaultV4(_donationVault);
        trustees = _trustees;

        for (uint256 i = 0; i < 3; i++) {
            isTrustee[_trustees[i]] = true;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        PROPOSE WITHDRAW
    //////////////////////////////////////////////////////////////*/
    function proposeWithdraw(
        uint256 campaignId
    ) external onlyTrustee returns (uint256 proposalId) {
        proposalId = ++proposalCount;

        Proposal storage p = proposals[proposalId];
        p.campaignId = campaignId;
        p.status = ProposalStatus.PENDING;

        emit WithdrawProposed(
            proposalId,
            campaignId
        );
    }

    /*//////////////////////////////////////////////////////////////
                                VOTE
    //////////////////////////////////////////////////////////////*/
    function vote(
        uint256 proposalId,
        bool support
    ) external onlyTrustee {
        Proposal storage p = proposals[proposalId];

        if (p.status != ProposalStatus.PENDING)
            revert ProposalAlreadyFinalized();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        p.hasVoted[msg.sender] = true;
        p.votesCount++;

        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support);

        if (p.votesCount == 3) {
            _finalizeProposal(proposalId);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FINALIZE
    //////////////////////////////////////////////////////////////*/
    function _finalizeProposal(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];

        bool approved = p.yesVotes >= 2;

        if (approved) {
            p.status = ProposalStatus.APPROVED;

            // 🔐 HANYA SC_ONLY withdraw dieksekusi
            donationVault.executeWithdrawScOnly(p.campaignId);
            p.executed = true;

            emit WithdrawExecuted(
                proposalId,
                p.campaignId
            );
        } else {
            p.status = ProposalStatus.REJECTED;
        }

        emit ProposalFinalized(proposalId, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            uint256 campaignId,
            uint8 yesVotes,
            uint8 noVotes,
            uint8 votesCount,
            ProposalStatus status,
            bool executed
        )
    {
        Proposal storage p = proposals[proposalId];
        if (p.status == ProposalStatus.PENDING && p.campaignId == 0)
            revert InvalidProposal();

        return (
            p.campaignId,
            p.yesVotes,
            p.noVotes,
            p.votesCount,
            p.status,
            p.executed
        );
    }
}
