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
 * @author ---
 * @notice Kontrak penyimpanan dana donasi on-chain (USDT & USDC)
 * @dev Bersifat pasif: tidak melakukan voting dan tidak memvalidasi campaign.
 *      Penarikan dana hanya dapat dilakukan oleh kontrak Governance.
 */
contract DonationVault {

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

    /// @notice Event donasi (dipakai untuk transparansi & audit)
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

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Deployer kontrak (hanya untuk setup awal)
    address public owner;

    /// @notice Kontrak Governance yang berwenang melakukan withdraw
    address public governance;

    /// @notice Token whitelist (immutable)
    address public immutable USDT;
    address public immutable USDC;

    /// @notice campaignId => token => total dana
    mapping(uint256 => mapping(address => uint256)) private _campaignBalances;

    /// @notice campaignId => status final penarikan
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

    /**
     * @param _usdt Address token USDT (BSC Testnet)
     * @param _usdc Address token USDC (BSC Testnet)
     */
    constructor(address _usdt, address _usdc) {
        if (_usdt == address(0) || _usdc == address(0)) revert ZeroAddress();

        owner = msg.sender;
        USDT = _usdt;
        USDC = _usdc;
    }

    /*//////////////////////////////////////////////////////////////
                         GOVERNANCE SETUP
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Menetapkan kontrak Governance (hanya sekali)
     * @dev Owner tidak memiliki hak penarikan dana
     */
    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert ZeroAddress();
        if (governance != address(0)) revert GovernanceAlreadySet();

        governance = _governance;
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Total dana campaign untuk token tertentu
    function getCampaignBalance(
        uint256 campaignId,
        address token
    ) external view returns (uint256) {
        return _campaignBalances[campaignId][token];
    }

    /// @notice Mengecek apakah campaign sudah ditarik (final)
    function isWithdrawn(uint256 campaignId) external view returns (bool) {
        return _withdrawn[campaignId];
    }

    /// @notice Total saldo Vault untuk token tertentu
    function getVaultBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /*//////////////////////////////////////////////////////////////
                                DONATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Donasi token USDT / USDC ke campaign tertentu
     * @dev Donatur wajib melakukan approve terlebih dahulu
     */
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

    /**
     * @notice Menarik SELURUH dana campaign (final)
     * @dev Hanya dapat dipanggil oleh kontrak Governance
     */
    function withdrawCampaign(
        uint256 campaignId,
        address adminPuraWallet
    ) external onlyGovernance {
        if (adminPuraWallet == address(0)) revert ZeroAddress();
        if (_withdrawn[campaignId]) revert AlreadyWithdrawn();

        uint256 usdtAmount = _campaignBalances[campaignId][USDT];
        uint256 usdcAmount = _campaignBalances[campaignId][USDC];

        if (usdtAmount == 0 && usdcAmount == 0) revert NothingToWithdraw();

        // Finalisasi campaign SEBELUM transfer (anti double-execution)
        _withdrawn[campaignId] = true;

        // Reset saldo campaign
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
