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
 * @notice Vault dana donasi on-chain (USDT & USDC) dengan anchor campaign
 * @dev
 * - Tidak menyimpan metadata campaign
 * - Tidak memvalidasi campaign
 * - Tetap menerima donasi meskipun DB mati
 * - Registrasi campaign hanya untuk audit & redundancy
 */
contract Donation {

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotOwner();
    error NotGovernance();
    error GovernanceAlreadySet();
    error ZeroAddress();

    error AmountZero();
    error TokenNotWhitelisted();
    error CampaignAlreadyWithdrawn();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Event donasi (ledger utama on-chain)
    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Event penarikan dana campaign (final)
    event CampaignWithdrawn(
        uint256 indexed campaignId,
        address indexed adminPuraWallet,
        uint256 usdtAmount,
        uint256 usdcAmount,
        uint256 timestamp
    );

    /// @notice Event anchor campaign (audit & redundancy)
    event CampaignRegistered(
        uint256 indexed campaignId,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Deployer kontrak (setup awal)
    address public owner;

    /// @notice Kontrak Governance (penarikan dana)
    address public governance;

    /// @notice Token whitelist (immutable)
    address public immutable USDT;
    address public immutable USDC;

    /// @notice campaignId => token => total dana
    mapping(uint256 => mapping(address => uint256)) private _campaignBalances;

    /// @notice campaignId => status penarikan final
    mapping(uint256 => bool) private _withdrawn;

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
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getCampaignBalance(
        uint256 campaignId,
        address token
    ) external view returns (uint256) {
        return _campaignBalances[campaignId][token];
    }

    function isWithdrawn(uint256 campaignId) external view returns (bool) {
        return _withdrawn[campaignId];
    }

    function getVaultBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /*//////////////////////////////////////////////////////////////
                          CAMPAIGN ANCHOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mencatat eksistensi campaign secara on-chain
     * @dev
     * - Tidak menyimpan state
     * - Tidak memvalidasi campaign
     * - Tidak memengaruhi donasi
     * - Digunakan untuk audit & recovery saat DB mati
     */
    function registerCampaign(uint256 campaignId)
        external
        onlyGovernance
    {
        emit CampaignRegistered(campaignId, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                                DONATION
    //////////////////////////////////////////////////////////////*/

    function donate(
        uint256 campaignId,
        address token,
        uint256 amount
    ) external {
        if (amount == 0) revert AmountZero();
        if (_withdrawn[campaignId]) revert CampaignAlreadyWithdrawn();
        if (token != USDT && token != USDC) revert TokenNotWhitelisted();

        bool success = IERC20(token).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) revert TransferFailed();

        _campaignBalances[campaignId][token] += amount;

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
        if (adminPuraWallet == address(0)) revert ZeroAddress();
        if (_withdrawn[campaignId]) revert AlreadyWithdrawn();

        uint256 usdtAmount = _campaignBalances[campaignId][USDT];
        uint256 usdcAmount = _campaignBalances[campaignId][USDC];

        if (usdtAmount == 0 && usdcAmount == 0) revert NothingToWithdraw();

        _withdrawn[campaignId] = true;

        _campaignBalances[campaignId][USDT] = 0;
        _campaignBalances[campaignId][USDC] = 0;

        if (usdtAmount > 0) {
            bool ok = IERC20(USDT).transfer(adminPuraWallet, usdtAmount);
            if (!ok) revert TransferFailed();
        }

        if (usdcAmount > 0) {
            bool ok = IERC20(USDC).transfer(adminPuraWallet, usdcAmount);
            if (!ok) revert TransferFailed();
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
