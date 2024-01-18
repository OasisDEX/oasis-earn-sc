// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

interface IProtocolFeesCollector {
    function getFlashLoanFeePercentage() external view returns (uint256);
}
