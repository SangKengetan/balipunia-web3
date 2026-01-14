// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FinancialReportAnchor
 * @notice Smart contract untuk anchor CID laporan keuangan ke blockchain
 * @dev Event-only, tanpa state storage (hemat gas)
 */
contract FinancialReportAnchor {

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event FinancialReportAnchored(
        address indexed adminPuraWallet,
        string ipfsCid,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAddress();
    error EmptyCID();

    /*//////////////////////////////////////////////////////////////
                                FUNCTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Anchor laporan keuangan ke blockchain
     * @param ipfsCid CID IPFS laporan keuangan
     */
    function anchorReport(string calldata ipfsCid) external {
        if (msg.sender == address(0)) revert ZeroAddress();
        if (bytes(ipfsCid).length == 0) revert EmptyCID();

        emit FinancialReportAnchored(
            msg.sender,
            ipfsCid,
            block.timestamp
        );
    }
}
