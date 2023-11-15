// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { MarketParams } from "../../interfaces/morpho-blue/IMorpho.sol";

struct DepositData {
  MarketParams marketParams;
  uint256 amount;
  bool sumAmounts;
}

struct BorrowData {
  MarketParams marketParams;
  uint256 amount;
}

struct WithdrawData {
  MarketParams marketParams;
  uint256 amount;
  address to;
}

struct PaybackData {
  MarketParams marketParams;
  uint256 amount;
  address onBehalf;
}
