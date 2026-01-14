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
                        DONATION VAULT V3
//////////////////////////////////////////////////////////////*/
contract DonationVaultV3 {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotOwner();
    error NotVoting();
    error ZeroAddress();
    error AmountZero();
    error TokenNotWhitelisted();
    error CampaignExpired();
    error CampaignNotFound();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event ScCampaignRegistered(
        uint256 indexed campaignId,
        bytes32 titleHash,
        uint64 deadline,
        address indexed creator
    );

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event Withdrawn(
        uint256 indexed campaignId,
        address indexed adminPuraWallet,
        uint256 usdtAmount,
        uint256 usdcAmount,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/
    address public owner;
    address public voting;

    address public immutable USDT;
    address public immutable USDC;

    enum CampaignType {
        SC_ONLY,
        HYBRID
    }

    struct ScCampaign {
        bytes32 titleHash;
        uint64 deadline;
        address creator;
        bool withdrawn;
        bool exists;
    }

    // === CASE 1 ONLY ===
    mapping(uint256 => ScCampaign) private scCampaigns;

    // === CASE 1 & CASE 2 ===
    mapping(uint256 => mapping(address => uint256)) private balances;

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
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
        owner = msg.sender;
        USDT = _usdt;
        USDC = _usdc;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN CONFIG
    //////////////////////////////////////////////////////////////*/
    function setVoting(address _voting) external onlyOwner {
        if (_voting == address(0)) revert ZeroAddress();
        voting = _voting;
    }

    /*//////////////////////////////////////////////////////////////
                    CASE 1 — SC-ONLY CAMPAIGN
    //////////////////////////////////////////////////////////////*/
    function registerScCampaign(
        uint256 campaignId,
        bytes32 titleHash,
        uint64 deadline,
        address creator
    ) external onlyOwner {
        if (creator == address(0)) revert ZeroAddress();
        if (scCampaigns[campaignId].exists) revert CampaignNotFound();

        scCampaigns[campaignId] = ScCampaign({
            titleHash: titleHash,
            deadline: deadline,
            creator: creator,
            withdrawn: false,
            exists: true
        });

        emit ScCampaignRegistered(campaignId, titleHash, deadline, creator);
    }

    /*//////////////////////////////////////////////////////////////
                                DONATE
    //////////////////////////////////////////////////////////////*/
    function donate(
        uint256 campaignId,
        CampaignType campaignType,
        address token,
        uint256 amount
    ) external {
        if (amount == 0) revert AmountZero();
        if (token != USDT && token != USDC) revert TokenNotWhitelisted();

        // CASE 1 validation
        if (campaignType == CampaignType.SC_ONLY) {
            ScCampaign memory c = scCampaigns[campaignId];
            if (!c.exists) revert CampaignNotFound();
            if (block.timestamp > c.deadline) revert CampaignExpired();
        }

        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        balances[campaignId][token] += amount;

        emit Donated(
            campaignId,
            msg.sender,
            token,
            amount,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                                WITHDRAW
    //////////////////////////////////////////////////////////////*/
    function withdraw(
        uint256 campaignId,
        address adminPuraWallet
    ) external onlyVoting {
        if (adminPuraWallet == address(0)) revert ZeroAddress();

        uint256 usdtAmount = balances[campaignId][USDT];
        uint256 usdcAmount = balances[campaignId][USDC];
        if (usdtAmount == 0 && usdcAmount == 0) revert NothingToWithdraw();

        // CASE 1 withdrawn lock
        if (scCampaigns[campaignId].exists) {
            if (scCampaigns[campaignId].withdrawn) revert AlreadyWithdrawn();
            scCampaigns[campaignId].withdrawn = true;
        }

        balances[campaignId][USDT] = 0;
        balances[campaignId][USDC] = 0;

        if (usdtAmount > 0) {
            if (!IERC20(USDT).transfer(adminPuraWallet, usdtAmount))
                revert TransferFailed();
        }

        if (usdcAmount > 0) {
            if (!IERC20(USDC).transfer(adminPuraWallet, usdcAmount))
                revert TransferFailed();
        }

        emit Withdrawn(
            campaignId,
            adminPuraWallet,
            usdtAmount,
            usdcAmount,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function getScCampaign(
        uint256 campaignId
    )
        external
        view
        returns (
            bytes32 titleHash,
            uint64 deadline,
            address creator,
            bool withdrawn
        )
    {
        ScCampaign memory c = scCampaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        return (c.titleHash, c.deadline, c.creator, c.withdrawn);
    }

    function getBalance(
        uint256 campaignId,
        address token
    ) external view returns (uint256) {
        return balances[campaignId][token];
    }
}
