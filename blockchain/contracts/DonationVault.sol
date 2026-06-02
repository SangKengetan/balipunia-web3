// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DonationVault {
    error NotSuperAdmin();
    error NotAdminPura();
    error NotVoting();
    error ZeroAddress();
    error AmountZero();
    error TokenNotWhitelisted();
    error CampaignNotFound();
    error CampaignAlreadyExists();
    error CampaignExpired();
    error CampaignStillRunning();
    error AlreadyWithdrawn();
    error TransferFailed();
    error CryptoDonationNotAllowed();

    event AdminPuraRegistered(address indexed admin);
    event AdminPuraRemoved(address indexed admin);
    event VotingUpdated(address indexed voting);
    event SuperAdminTreasuryUpdated(address indexed treasury);

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed adminPura,
        CampaignType campaignType,
        address payoutWallet,
        uint64 deadline
    );

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event CryptoWithdrawExecuted(
        uint256 indexed campaignId,
        address indexed superAdminTreasury,
        uint256 usdtAmount,
        uint256 usdcAmount
    );

    event OffchainWithdrawApproved(
        uint256 indexed campaignId,
        address indexed adminPura,
        CampaignType campaignType,
        uint256 timestamp
    );

    event WithdrawFinalized(
        uint256 indexed campaignId,
        CampaignType campaignType,
        uint256 withdrawCount,
        uint256 timestamp
    );

    address public superAdmin;
    address public voting;
    address public superAdminTreasury;

    address public immutable USDT;
    address public immutable USDC;

    mapping(address => bool) public adminPura;

    enum CampaignType {
        HYBRID,
        MIDTRANS_ONLY,
        CRYPTO_ONLY
    }

    struct Campaign {
        CampaignType campaignType;
        address adminPura;
        address payoutWallet;
        uint64 deadline; // 0 = open-ended
        bool withdrawn; // hanya dipakai untuk campaign deadline
        bool exists;
    }

    struct DonationRecord {
        address donor;
        address token;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(address => uint256)) private balances;
    mapping(uint256 => DonationRecord[]) private donationHistory;
    mapping(uint256 => uint256) public withdrawCountByCampaign;

    modifier onlySuperAdmin() {
        if (msg.sender != superAdmin) revert NotSuperAdmin();
        _;
    }

    modifier onlyAdminPura() {
        if (!adminPura[msg.sender]) revert NotAdminPura();
        _;
    }

    modifier onlyVoting() {
        if (msg.sender != voting) revert NotVoting();
        _;
    }

    constructor(
        address _usdt,
        address _usdc,
        address _superAdminTreasury
    ) {
        if (_usdt == address(0) || _usdc == address(0) || _superAdminTreasury == address(0)) {
            revert ZeroAddress();
        }

        superAdmin = msg.sender;
        USDT = _usdt;
        USDC = _usdc;
        superAdminTreasury = _superAdminTreasury;
    }

    function setVoting(address _voting) external onlySuperAdmin {
        if (_voting == address(0)) revert ZeroAddress();
        voting = _voting;
        emit VotingUpdated(_voting);
    }

    function setSuperAdminTreasury(address _treasury) external onlySuperAdmin {
        if (_treasury == address(0)) revert ZeroAddress();
        superAdminTreasury = _treasury;
        emit SuperAdminTreasuryUpdated(_treasury);
    }

    function transferSuperAdmin(address newSuperAdmin) external onlySuperAdmin {
        if (newSuperAdmin == address(0)) revert ZeroAddress();
        superAdmin = newSuperAdmin;
    }

    function addAdminPura(address _admin) external onlySuperAdmin {
        if (_admin == address(0)) revert ZeroAddress();
        adminPura[_admin] = true;
        emit AdminPuraRegistered(_admin);
    }

    function removeAdminPura(address _admin) external onlySuperAdmin {
        adminPura[_admin] = false;
        emit AdminPuraRemoved(_admin);
    }

    function createCampaign(
        uint256 campaignId,
        CampaignType campaignType,
        address payoutWallet,
        uint64 deadline
    ) external onlyAdminPura {
        if (campaigns[campaignId].exists) revert CampaignAlreadyExists();
        if (payoutWallet == address(0)) revert ZeroAddress();

        // deadline = 0 berarti campaign open-ended
        if (deadline != 0 && deadline <= block.timestamp) revert CampaignExpired();

        campaigns[campaignId] = Campaign({
            campaignType: campaignType,
            adminPura: msg.sender,
            payoutWallet: payoutWallet,
            deadline: deadline,
            withdrawn: false,
            exists: true
        });

        emit CampaignCreated(campaignId, msg.sender, campaignType, payoutWallet, deadline);
    }

    function donate(
        uint256 campaignId,
        address token,
        uint256 amount
    ) external {
        if (amount == 0) revert AmountZero();
        if (token != USDT && token != USDC) revert TokenNotWhitelisted();

        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();

        if (c.campaignType == CampaignType.MIDTRANS_ONLY) {
            revert CryptoDonationNotAllowed();
        }

        // Jika deadline = 0, donasi selalu terbuka
        if (c.deadline != 0 && block.timestamp > c.deadline) {
            revert CampaignExpired();
        }

        if (!IERC20(token).transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        balances[campaignId][token] += amount;

        donationHistory[campaignId].push(
            DonationRecord({
                donor: msg.sender,
                token: token,
                amount: amount,
                timestamp: block.timestamp
            })
        );

        emit Donated(campaignId, msg.sender, token, amount, block.timestamp);
    }

    function executeApprovedWithdraw(uint256 campaignId) external onlyVoting {
        Campaign storage c = campaigns[campaignId];

        if (!c.exists) revert CampaignNotFound();

        // Campaign deadline hanya boleh withdraw sekali
        if (c.deadline != 0 && c.withdrawn) revert AlreadyWithdrawn();

        // Campaign deadline hanya bisa withdraw setelah deadline selesai
        if (c.deadline != 0 && block.timestamp < c.deadline) {
            revert CampaignStillRunning();
        }

        uint256 usdtAmount = balances[campaignId][USDT];
        uint256 usdcAmount = balances[campaignId][USDC];

        if (
            c.campaignType == CampaignType.CRYPTO_ONLY ||
            c.campaignType == CampaignType.HYBRID
        ) {
            balances[campaignId][USDT] = 0;
            balances[campaignId][USDC] = 0;

            if (usdtAmount > 0) {
                if (!IERC20(USDT).transfer(superAdminTreasury, usdtAmount)) {
                    revert TransferFailed();
                }
            }

            if (usdcAmount > 0) {
                if (!IERC20(USDC).transfer(superAdminTreasury, usdcAmount)) {
                    revert TransferFailed();
                }
            }

            emit CryptoWithdrawExecuted(
                campaignId,
                superAdminTreasury,
                usdtAmount,
                usdcAmount
            );
        }

        if (
            c.campaignType == CampaignType.MIDTRANS_ONLY ||
            c.campaignType == CampaignType.HYBRID
        ) {
            emit OffchainWithdrawApproved(
                campaignId,
                c.adminPura,
                c.campaignType,
                block.timestamp
            );
        }

        // hanya campaign deadline yang ditandai withdrawn permanen
        if (c.deadline != 0) {
            c.withdrawn = true;
        }

        withdrawCountByCampaign[campaignId]++;

        emit WithdrawFinalized(
            campaignId,
            c.campaignType,
            withdrawCountByCampaign[campaignId],
            block.timestamp
        );
    }

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
        )
    {
        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();

        return (
            c.campaignType,
            c.adminPura,
            c.payoutWallet,
            c.deadline,
            c.withdrawn
        );
    }

    function getBalance(uint256 campaignId, address token) external view returns (uint256) {
        return balances[campaignId][token];
    }

    function getDonationCount(uint256 campaignId) external view returns (uint256) {
        return donationHistory[campaignId].length;
    }

    function getDonationHistory(
        uint256 campaignId,
        uint256 index
    )
        external
        view
        returns (
            address donor,
            address token,
            uint256 amount,
            uint256 timestamp
        )
    {
        DonationRecord memory d = donationHistory[campaignId][index];
        return (d.donor, d.token, d.amount, d.timestamp);
    }

    function isOpenEnded(uint256 campaignId) external view returns (bool) {
        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        return c.deadline == 0;
    }

    function isCampaignExpired(uint256 campaignId) external view returns (bool) {
        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();

        if (c.deadline == 0) return false;
        return block.timestamp > c.deadline;
    }

    function isWithdrawn(uint256 campaignId) external view returns (bool) {
        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        return c.withdrawn;
    }
}