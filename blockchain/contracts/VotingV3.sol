// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDonationVault {
    enum CampaignType {
        HYBRID,
        MIDTRANS_ONLY,
        CRYPTO_ONLY
    }

    function adminPura(address account) external view returns (bool);

    function getCampaign(
        uint256 campaignId
    )
        external
        view
        returns (
            CampaignType campaignType,
            address adminPuraWallet,
            address payoutWallet,
            uint64 deadline,
            bool withdrawn
        );

    function executeApprovedWithdraw(uint256 campaignId) external;
}

contract VotingGovernance {
    error NotAdminPura();
    error NotTrustee();
    error ZeroAddress();
    error DuplicateTrustee();
    error TrusteesNotSet();
    error ActiveProposalExists();
    error InvalidProposal();
    error AlreadyVoted();
    error ProposalAlreadyFinalized();
    error CampaignNotOwnedByAdmin();
    error CampaignStillRunning();
    error CampaignAlreadyWithdrawn();

    event TrusteesUpdated(
        address indexed adminPura,
        address trustee1,
        address trustee2,
        address trustee3
    );

    event WithdrawRequested(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        address indexed adminPura
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed trustee,
        bool support
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        uint256 indexed campaignId,
        bool approved
    );

    event WithdrawExecuted(
        uint256 indexed proposalId,
        uint256 indexed campaignId
    );

    IDonationVault public immutable donationVault;

    mapping(address => address[3]) public trusteesOfAdmin;
    mapping(address => mapping(address => bool)) public isTrusteeOfAdmin;

    mapping(uint256 => bool) public hasActiveProposalByCampaign;
    mapping(address => uint256) public activeProposalCountByAdmin;

    uint256 public proposalCount;

    enum ProposalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    struct Proposal {
        uint256 campaignId;
        address adminPura;
        uint8 yesVotes;
        uint8 noVotes;
        uint8 votesCount;
        ProposalStatus status;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) private proposals;

    constructor(address _donationVault) {
        if (_donationVault == address(0)) revert ZeroAddress();
        donationVault = IDonationVault(_donationVault);
    }

    modifier onlyAdminPura() {
        if (!donationVault.adminPura(msg.sender)) revert NotAdminPura();
        _;
    }

    function setTrustees(address[3] calldata _trustees) external onlyAdminPura {
        if (activeProposalCountByAdmin[msg.sender] > 0) {
            revert ActiveProposalExists();
        }

        _validateTrustees(_trustees);

        address[3] memory oldTrustees = trusteesOfAdmin[msg.sender];

        for (uint256 i = 0; i < 3; i++) {
            if (oldTrustees[i] != address(0)) {
                isTrusteeOfAdmin[msg.sender][oldTrustees[i]] = false;
            }
        }

        trusteesOfAdmin[msg.sender] = _trustees;

        for (uint256 i = 0; i < 3; i++) {
            isTrusteeOfAdmin[msg.sender][_trustees[i]] = true;
        }

        emit TrusteesUpdated(
            msg.sender,
            _trustees[0],
            _trustees[1],
            _trustees[2]
        );
    }

    function requestWithdraw(
        uint256 campaignId
    ) external onlyAdminPura returns (uint256 proposalId) {
        if (hasActiveProposalByCampaign[campaignId]) {
            revert ActiveProposalExists();
        }

        (
            ,
            address campaignAdmin,
            ,
            uint64 deadline,
            bool withdrawn
        ) = donationVault.getCampaign(campaignId);

        if (campaignAdmin != msg.sender) revert CampaignNotOwnedByAdmin();

        // Campaign deadline hanya boleh withdraw sekali
        if (deadline != 0 && withdrawn) revert CampaignAlreadyWithdrawn();

        // Campaign deadline hanya bisa request setelah deadline
        if (deadline != 0 && block.timestamp < deadline) {
            revert CampaignStillRunning();
        }

        // Campaign open-ended boleh request kapan saja
        if (!_hasValidTrustees(msg.sender)) revert TrusteesNotSet();

        proposalId = ++proposalCount;

        Proposal storage p = proposals[proposalId];
        p.campaignId = campaignId;
        p.adminPura = msg.sender;
        p.status = ProposalStatus.PENDING;

        hasActiveProposalByCampaign[campaignId] = true;
        activeProposalCountByAdmin[msg.sender]++;

        emit WithdrawRequested(proposalId, campaignId, msg.sender);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];

        if (p.adminPura == address(0)) revert InvalidProposal();
        if (p.status != ProposalStatus.PENDING) revert ProposalAlreadyFinalized();

        if (!isTrusteeOfAdmin[p.adminPura][msg.sender]) revert NotTrustee();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        p.hasVoted[msg.sender] = true;
        p.votesCount++;

        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }

        emit VoteCast(proposalId, msg.sender, support);

        if (p.yesVotes >= 2) {
            _approveProposal(proposalId);
        } else if (p.noVotes >= 2) {
            _rejectProposal(proposalId);
        }
    }

    function _approveProposal(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];

        p.status = ProposalStatus.APPROVED;

        _clearActiveProposal(p.adminPura, p.campaignId);

        donationVault.executeApprovedWithdraw(p.campaignId);

        p.executed = true;

        emit WithdrawExecuted(proposalId, p.campaignId);
        emit ProposalFinalized(proposalId, p.campaignId, true);
    }

    function _rejectProposal(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];

        p.status = ProposalStatus.REJECTED;

        _clearActiveProposal(p.adminPura, p.campaignId);

        emit ProposalFinalized(proposalId, p.campaignId, false);
    }

    function _clearActiveProposal(address admin, uint256 campaignId) internal {
        hasActiveProposalByCampaign[campaignId] = false;

        if (activeProposalCountByAdmin[admin] > 0) {
            activeProposalCountByAdmin[admin]--;
        }
    }

    function _validateTrustees(address[3] calldata _trustees) internal pure {
        if (
            _trustees[0] == address(0) ||
            _trustees[1] == address(0) ||
            _trustees[2] == address(0)
        ) revert ZeroAddress();

        if (
            _trustees[0] == _trustees[1] ||
            _trustees[0] == _trustees[2] ||
            _trustees[1] == _trustees[2]
        ) revert DuplicateTrustee();
    }

    function _hasValidTrustees(address admin) internal view returns (bool) {
        address[3] memory t = trusteesOfAdmin[admin];

        return (
            t[0] != address(0) &&
            t[1] != address(0) &&
            t[2] != address(0)
        );
    }

    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            uint256 campaignId,
            address adminPura,
            uint8 yesVotes,
            uint8 noVotes,
            uint8 votesCount,
            ProposalStatus status,
            bool executed
        )
    {
        Proposal storage p = proposals[proposalId];
        if (p.adminPura == address(0)) revert InvalidProposal();

        return (
            p.campaignId,
            p.adminPura,
            p.yesVotes,
            p.noVotes,
            p.votesCount,
            p.status,
            p.executed
        );
    }

    function getTrustees(address admin) external view returns (address[3] memory) {
        return trusteesOfAdmin[admin];
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        Proposal storage p = proposals[proposalId];
        if (p.adminPura == address(0)) revert InvalidProposal();

        return p.hasVoted[voter];
    }

    function isTrustee(address admin, address trustee) external view returns (bool) {
        return isTrusteeOfAdmin[admin][trustee];
    }
}