// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import { FakeERC20 } from "./FakeERC20.sol";

/**
    @title TestERC20MinterPauser

    @author Roberto Cano <robercano>

    @notice Mock contract for an ERC20 with minting and pausing capabilities
 */
contract FakeDAI is FakeERC20 {
  // solhint-disable-next-line no-empty-blocks
  constructor() FakeERC20("Dai Stablecoin", "DAI", 18) {}
}
