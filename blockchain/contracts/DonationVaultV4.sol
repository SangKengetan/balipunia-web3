// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationVaultV3Plus is Ownable {

    /* =========================
       EXISTING STORAGE (KEEP)
    ========================= */

    mapping(uint256 => bool) public withdrawn;          // SC_ONLY
    mapping(uint256 => address) public campaignOwner;   // SC_ONLY

    /* =========================
       NEW STORAGE (HYBRID)
    ========================= */

    mapping(uint256 => bool) public hybridWithdrawn;
    mapping(uint256 => address) public hybridWallet;

    event Withdrawn(
        uint256 indexed campaignKey,
        address token,
        address to,
        uint256 amount
    );

    /* =========================
       EXISTING FUNCTION (KEEP)
    ========================= */

    function withdraw(
        uint256 scCampaignId,
        address token
    ) external onlyOwner {
        require(!withdrawn[scCampaignId], "ALREADY_WITHDRAWN");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "NO_BALANCE");

        withdrawn[scCampaignId] = true;
        IERC20(token).transfer(msg.sender, balance);

        emit Withdrawn(scCampaignId, token, msg.sender, balance);
    }

    /* =========================
       NEW HYBRID FUNCTIONS
    ========================= */

    function setHybridWallet(
        uint256 hybridCampaignKey,
        address wallet
    ) external onlyOwner {
        require(wallet != address(0), "INVALID_WALLET");
        hybridWallet[hybridCampaignKey] = wallet;
    }

    function withdrawHybrid(
        uint256 hybridCampaignKey,
        address token
    ) external onlyOwner {
        require(!hybridWithdrawn[hybridCampaignKey], "ALREADY_WITHDRAWN");

        address to = hybridWallet[hybridCampaignKey];
        require(to != address(0), "WALLET_NOT_SET");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "NO_BALANCE");

        hybridWithdrawn[hybridCampaignKey] = true;
        IERC20(token).transfer(to, balance);

        emit Withdrawn(hybridCampaignKey, token, to, balance);
    }
}
