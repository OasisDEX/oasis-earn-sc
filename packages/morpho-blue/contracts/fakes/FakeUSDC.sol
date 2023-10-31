// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.19;

import { FakeERC20 } from "./FakeERC20.sol";

/**
    @title FakeDAI

    @notice Fake DAI token
 */
contract FakeUSDC is FakeERC20 {
  // solhint-disable-next-line no-empty-blocks
  constructor() FakeERC20("USDC", "USDC", 18) {}
}
