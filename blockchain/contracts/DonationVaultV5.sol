// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*//////////////////////////////////////////////////////////////
                        ERC20 MINIMAL
//////////////////////////////////////////////////////////////*/
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/*//////////////////////////////////////////////////////////////
                    DONATION VAULT V3 (FINAL)
//////////////////////////////////////////////////////////////*/
contract DonationVaultV5 {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotSuperAdmin();
    error NotAdminPura();
    error NotVoting();
    error ZeroAddress();
    error AmountZero();
    error TokenNotWhitelisted();
    error CampaignNotFound();
    error CampaignExpired();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error TransferFailed();
    error InvalidCampaignType();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event AdminPuraRegistered(address indexed admin);
    event AdminPuraRemoved(address indexed admin);

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed adminPura,
        CampaignType campaignType,
        uint64 deadline
    );

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event WithdrawExecutedScOnly(
        uint256 indexed campaignId,
        address indexed payoutWallet,
        uint256 usdtAmount,
        uint256 usdcAmount
    );

    event HybridWithdrawFinalized(
        uint256 indexed campaignId,
        address indexed adminPura,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/
    address public superAdmin;
    address public voting;

    address public immutable USDT;
    address public immutable USDC;

    mapping(address => bool) public adminPura;

    enum CampaignType {
        SC_ONLY,
        HYBRID
    }

    struct Campaign {
        CampaignType campaignType;
        address adminPura;
        address payoutWallet;
        uint64 deadline;
        bool withdrawn;
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

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
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

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address _usdt, address _usdc) {
        if (_usdt == address(0) || _usdc == address(0)) revert ZeroAddress();
        superAdmin = msg.sender;
        USDT = _usdt;
        USDC = _usdc;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN CONFIG
    //////////////////////////////////////////////////////////////*/
    function setVoting(address _voting) external onlySuperAdmin {
        if (_voting == address(0)) revert ZeroAddress();
        voting = _voting;
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

    /*//////////////////////////////////////////////////////////////
                        CREATE CAMPAIGN
    //////////////////////////////////////////////////////////////*/
    function createCampaign(
        uint256 campaignId,
        CampaignType campaignType,
        address payoutWallet,
        uint64 deadline
    ) external onlyAdminPura {
        if (payoutWallet == address(0)) revert ZeroAddress();
        if (campaigns[campaignId].exists) revert CampaignNotFound();

        if (campaignType == CampaignType.SC_ONLY && deadline == 0) {
            revert CampaignExpired();
        }

        campaigns[campaignId] = Campaign({
            campaignType: campaignType,
            adminPura: msg.sender,
            payoutWallet: payoutWallet,
            deadline: deadline,
            withdrawn: false,
            exists: true
        });

        emit CampaignCreated(campaignId, msg.sender, campaignType, deadline);
    }

    /*//////////////////////////////////////////////////////////////
                                DONATE
    //////////////////////////////////////////////////////////////*/
    function donate(
        uint256 campaignId,
        address token,
        uint256 amount
    ) external {
        if (amount == 0) revert AmountZero();
        if (token != USDT && token != USDC) revert TokenNotWhitelisted();

        // === SC-ONLY VALIDATION (ONLY IF REGISTERED) ===
        Campaign memory c = campaigns[campaignId];
        if (c.exists) {
            if (
                c.campaignType == CampaignType.SC_ONLY &&
                block.timestamp > c.deadline
            ) revert CampaignExpired();
        }
        // NOTE:
        // - Jika campaign tidak exists → diasumsikan HYBRID (V3 behavior)
        // - Tidak dilakukan revert CampaignNotFound()

        if (!IERC20(token).transferFrom(msg.sender, address(this), amount))
            revert TransferFailed();

        balances[campaignId][token] += amount;

        donationHistory[campaignId].push(
            DonationRecord(msg.sender, token, amount, block.timestamp)
        );

        emit Donated(campaignId, msg.sender, token, amount, block.timestamp);
    }


    /*//////////////////////////////////////////////////////////////
                    WITHDRAW — SC ONLY
    //////////////////////////////////////////////////////////////*/
    function executeWithdrawScOnly(
        uint256 campaignId
    ) external onlyVoting {
        Campaign storage c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        if (c.campaignType != CampaignType.SC_ONLY) revert InvalidCampaignType();
        if (c.withdrawn) revert AlreadyWithdrawn();

        uint256 usdtAmount = balances[campaignId][USDT];
        uint256 usdcAmount = balances[campaignId][USDC];
        if (usdtAmount == 0 && usdcAmount == 0) revert NothingToWithdraw();

        c.withdrawn = true;
        balances[campaignId][USDT] = 0;
        balances[campaignId][USDC] = 0;

        if (usdtAmount > 0) {
            if (!IERC20(USDT).transfer(c.payoutWallet, usdtAmount))
                revert TransferFailed();
        }

        if (usdcAmount > 0) {
            if (!IERC20(USDC).transfer(c.payoutWallet, usdcAmount))
                revert TransferFailed();
        }

        emit WithdrawExecutedScOnly(
            campaignId,
            c.payoutWallet,
            usdtAmount,
            usdcAmount
        );
    }

    /*//////////////////////////////////////////////////////////////
                HYBRID WITHDRAW FINALIZATION
    //////////////////////////////////////////////////////////////*/
    function finalizeHybridWithdraw(
        uint256 campaignId
    ) external onlyAdminPura {
        Campaign memory c = campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        if (c.campaignType != CampaignType.HYBRID) revert InvalidCampaignType();
        if (c.adminPura != msg.sender) revert NotAdminPura();

        emit HybridWithdrawFinalized(
            campaignId,
            msg.sender,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
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

    function getBalance(
        uint256 campaignId,
        address token
    ) external view returns (uint256) {
        return balances[campaignId][token];
    }

    function getDonationCount(
        uint256 campaignId
    ) external view returns (uint256) {
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
}
