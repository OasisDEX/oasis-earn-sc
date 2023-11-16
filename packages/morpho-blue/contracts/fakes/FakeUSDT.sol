// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.19;

import { FakeERC20NonStandard } from "./FakeERC20NonStandard.sol";

/**
    @title FakeUSDT

    @notice Fake USDT token that does not return a boolean on transfer or transferFrom
 */
contract FakeUSDT is FakeERC20NonStandard {
  // solhint-disable-next-line no-empty-blocks
  constructor() FakeERC20NonStandard("Tether USD", "USDT", 6) {}
}
