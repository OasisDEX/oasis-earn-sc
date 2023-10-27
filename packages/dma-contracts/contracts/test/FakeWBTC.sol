// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import { FakeERC20 } from "./FakeERC20.sol";

/**
    @title FakeWBTC

    @notice Fake WBTC token
 */
contract FakeWBTC is FakeERC20 {
  // solhint-disable-next-line no-empty-blocks
  constructor() FakeERC20("Wrapped BTC", "WBTC", 8) {}
}
