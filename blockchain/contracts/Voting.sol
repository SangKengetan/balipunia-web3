// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*//////////////////////////////////////////////////////////////
                        INTERFACE
//////////////////////////////////////////////////////////////*/
interface IDonationVaultV3 {
    function withdraw(
        uint256 campaignId,
        address adminPuraWallet
    ) external;
}

/*//////////////////////////////////////////////////////////////
                            VOTING
//////////////////////////////////////////////////////////////*/
contract Voting {
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
        uint256 indexed campaignId,
        address indexed adminPuraWallet
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
        uint256 indexed campaignId,
        address adminPuraWallet
    );

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/
    IDonationVaultV3 public immutable donationVault;

    address[3] public trustees;
    mapping(address => bool) public isTrustee;

    uint256 public proposalCount;

    struct Proposal {
        uint256 campaignId;
        address adminPuraWallet;

        uint8 yesVotes;
        uint8 noVotes;
        uint8 votesCount;

        bool finalized;
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

        donationVault = IDonationVaultV3(_donationVault);
        trustees = _trustees;

        for (uint256 i = 0; i < 3; i++) {
            isTrustee[_trustees[i]] = true;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        PROPOSE WITHDRAW
    //////////////////////////////////////////////////////////////*/
    function proposeWithdraw(
        uint256 campaignId,
        address adminPuraWallet
    ) external onlyTrustee returns (uint256 proposalId) {
        require(adminPuraWallet != address(0), "Invalid wallet");

        proposalId = ++proposalCount;

        Proposal storage p = proposals[proposalId];
        p.campaignId = campaignId;
        p.adminPuraWallet = adminPuraWallet;

        emit WithdrawProposed(
            proposalId,
            campaignId,
            adminPuraWallet
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

        if (p.campaignId == 0) revert InvalidProposal();
        if (p.finalized) revert ProposalAlreadyFinalized();
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
        p.finalized = true;

        if (approved) {
            donationVault.withdraw(
                p.campaignId,
                p.adminPuraWallet
            );
            p.executed = true;

            emit WithdrawExecuted(
                proposalId,
                p.campaignId,
                p.adminPuraWallet
            );
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
            address adminPuraWallet,
            uint8 yesVotes,
            uint8 noVotes,
            uint8 votesCount,
            bool finalized,
            bool executed
        )
    {
        Proposal storage p = proposals[proposalId];
        if (p.campaignId == 0) revert InvalidProposal();

        return (
            p.campaignId,
            p.adminPuraWallet,
            p.yesVotes,
            p.noVotes,
            p.votesCount,
            p.finalized,
            p.executed
        );
    }
}
