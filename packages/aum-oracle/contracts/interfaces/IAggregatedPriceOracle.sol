// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

/**
    The aggregated price oracle allows ...
 */
interface IAggregatedPriceOracle {
  // View
  function token() external view returns (address);

  function initialTimestamp() external view returns (uint256);

  function getAggregatedPrice(uint256 fromTimestamp) external returns (int256);

  // State change
  function setDailyPrice(int256 price) external;

  // Errors
  error StartTSAfterEndTS(uint256 startDate, uint256 endDate);
  error StartTSBeforeInitialTS(uint256 startDate, uint256 initialTimestamp);
}
