// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*//////////////////////////////////////////////////////////////
                        ERC20 MINIMAL INTERFACE
//////////////////////////////////////////////////////////////*/
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/*//////////////////////////////////////////////////////////////
                            DONATION VAULT
//////////////////////////////////////////////////////////////*/
/**
 * @title DonationVault
 * @notice Vault donasi on-chain dengan metadata kampanye minimal
 * @dev
 * - Ledger donasi on-chain (USDT & USDC)
 * - Metadata kampanye MINIMAL untuk fallback saat DB mati
 * - Governance mengeksekusi operasi kritikal
 */
contract DonationVaultV2 {

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotOwner();
    error NotGovernance();
    error GovernanceAlreadySet();
    error ZeroAddress();

    error AmountZero();
    error TokenNotWhitelisted();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error TransferFailed();
    error CampaignNotFound();
    error CampaignExpired();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event CampaignRegistered(
        uint256 indexed campaignId,
        bytes32 titleHash,
        uint64 deadline,
        address indexed creator,
        uint256 timestamp
    );

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event CampaignWithdrawn(
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
    address public governance;

    address public immutable USDT;
    address public immutable USDC;

    struct Campaign {
        bytes32 titleHash;
        uint64 deadline;
        address creator;
        bool exists;
        bool withdrawn;
    }

    /// campaignId => Campaign metadata
    mapping(uint256 => Campaign) private _campaigns;

    /// campaignId => token => balance
    mapping(uint256 => mapping(address => uint256)) private _balances;

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert NotGovernance();
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
                         GOVERNANCE SETUP
    //////////////////////////////////////////////////////////////*/
    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert ZeroAddress();
        if (governance != address(0)) revert GovernanceAlreadySet();
        governance = _governance;
    }

    /*//////////////////////////////////////////////////////////////
                        CAMPAIGN REGISTRATION
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Register campaign with minimal metadata
     * @dev Only governance executes; creator is recorded for accountability
     */
    function registerCampaign(
        uint256 campaignId,
        bytes32 titleHash,
        uint64 deadline,
        address creator
    ) external onlyGovernance {
        if (creator == address(0)) revert ZeroAddress();
        if (_campaigns[campaignId].exists) revert CampaignNotFound(); // reuse error to avoid extra gas
        _campaigns[campaignId] = Campaign({
            titleHash: titleHash,
            deadline: deadline,
            creator: creator,
            exists: true,
            withdrawn: false
        });

        emit CampaignRegistered(
            campaignId,
            titleHash,
            deadline,
            creator,
            block.timestamp
        );
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function getCampaign(uint256 campaignId)
        external
        view
        returns (bytes32 titleHash, uint64 deadline, address creator, bool withdrawn)
    {
        Campaign memory c = _campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        return (c.titleHash, c.deadline, c.creator, c.withdrawn);
    }

    function getCampaignBalance(uint256 campaignId, address token)
        external
        view
        returns (uint256)
    {
        return _balances[campaignId][token];
    }

    function getVaultBalance(address token)
        external
        view
        returns (uint256)
    {
        return IERC20(token).balanceOf(address(this));
    }

    /*//////////////////////////////////////////////////////////////
                                DONATION
    //////////////////////////////////////////////////////////////*/
    function donate(
        uint256 campaignId,
        address token,
        uint256 amount
    ) external {
        Campaign storage c = _campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        if (block.timestamp > c.deadline) revert CampaignExpired();
        if (amount == 0) revert AmountZero();
        if (token != USDT && token != USDC) revert TokenNotWhitelisted();

        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        _balances[campaignId][token] += amount;

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
    function withdrawCampaign(
        uint256 campaignId,
        address adminPuraWallet
    ) external onlyGovernance {
        Campaign storage c = _campaigns[campaignId];
        if (!c.exists) revert CampaignNotFound();
        if (c.withdrawn) revert AlreadyWithdrawn();
        if (adminPuraWallet == address(0)) revert ZeroAddress();

        uint256 usdtAmount = _balances[campaignId][USDT];
        uint256 usdcAmount = _balances[campaignId][USDC];
        if (usdtAmount == 0 && usdcAmount == 0) revert NothingToWithdraw();

        c.withdrawn = true;
        _balances[campaignId][USDT] = 0;
        _balances[campaignId][USDC] = 0;

        if (usdtAmount > 0) {
            bool ok1 = IERC20(USDT).transfer(adminPuraWallet, usdtAmount);
            if (!ok1) revert TransferFailed();
        }
        if (usdcAmount > 0) {
            bool ok2 = IERC20(USDC).transfer(adminPuraWallet, usdcAmount);
            if (!ok2) revert TransferFailed();
        }

        emit CampaignWithdrawn(
            campaignId,
            adminPuraWallet,
            usdtAmount,
            usdcAmount,
            block.timestamp
        );
    }
}
