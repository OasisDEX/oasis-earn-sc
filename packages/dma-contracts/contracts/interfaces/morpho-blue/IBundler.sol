// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.0;

import { MarketParams, Withdrawal } from "./IMorpho.sol";

interface IBundler {
  function multicall(bytes[] calldata data) external payable;

  function reallocateTo(
    address vault,
    Withdrawal[] calldata withdrawals,
    MarketParams calldata supplyMarketParams
  ) external payable;
}
