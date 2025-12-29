// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DonationVault
 * @notice Smart contract untuk menampung donasi USDT (BEP-20)
 *         per campaignId (off-chain)
 */

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account)
        external
        view
        returns (uint256);
}

contract DonationVault {

    address public owner;
    IERC20 public usdt;

    constructor(address _usdt) {
        owner = msg.sender;
        usdt = IERC20(_usdt);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /* =========================
        STRUCT & STORAGE
    ========================== */

    struct CampaignFund {
        uint256 totalDonated;
        bool exists;
    }

    mapping(uint256 => CampaignFund) public campaignFunds;

    /* =========================
        EVENTS (TRANSACTION LOG)
    ========================== */

    event Donated(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        uint256 timestamp
    );

    /* =========================
        DONATION LOGIC
    ========================== */

    function donate(uint256 campaignId, uint256 amount) external {
        require(amount > 0, "Invalid amount");

        if (!campaignFunds[campaignId].exists) {
            campaignFunds[campaignId] = CampaignFund({
                totalDonated: 0,
                exists: true
            });
        }

        bool success = usdt.transferFrom(
            msg.sender,
            address(this),
            amount
        );

        require(success, "USDT transfer failed");

        campaignFunds[campaignId].totalDonated += amount;

        emit Donated(
            campaignId,
            msg.sender,
            amount,
            block.timestamp
        );
    }

    /* =========================
        VIEW FUNCTIONS
    ========================== */

    function getTotalDonation(uint256 campaignId)
        external
        view
        returns (uint256)
    {
        return campaignFunds[campaignId].totalDonated;
    }

    function getVaultBalance()
        external
        view
        returns (uint256)
    {
        return usdt.balanceOf(address(this));
    }
}
