// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import { IIrm } from "../interfaces/IIrm.sol";
import { MarketParams, Market } from "../interfaces/IMorpho.sol";

import { MathLib } from "../libraries/MathLib.sol";

contract IrmMock is IIrm {
  using MathLib for uint128;

  uint256 public forcedRate;
  bool public forcedRateEnabled;

  function setForcedRate(uint256 _forcedRate) external {
    forcedRate = _forcedRate;
  }

  function setForcedRateEnabled(bool _forcedRateEnabled) external {
    forcedRateEnabled = _forcedRateEnabled;
  }

  function borrowRateView(MarketParams memory, Market memory market) public view returns (uint256) {
    if (forcedRateEnabled) {
      return forcedRate;
    }

    uint256 utilization = market.totalBorrowAssets.wDivDown(market.totalSupplyAssets);

    // Divide by the number of seconds in a year.
    // This is a very simple model where x% utilization corresponds to x% APR.
    return utilization / 365 days;
  }

  function borrowRate(
    MarketParams memory marketParams,
    Market memory market
  ) external view returns (uint256) {
    return borrowRateView(marketParams, market);
  }
}
