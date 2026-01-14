// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockDonationVault {
    event WithdrawCalled(uint256 campaignId, address adminPuraWallet);

    function withdrawCampaign(
        uint256 campaignId,
        address adminPuraWallet
    ) external {
        emit WithdrawCalled(campaignId, adminPuraWallet);
    }
}
