// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import {
  ERC20PresetMinterPauser
} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

/**
    @title FakeERC20

    @notice Mock contract for an ERC20 with minting and pausing capabilities
 */
contract FakeERC20 is ERC20PresetMinterPauser {
  uint8 private _decimals;

  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals_
  ) ERC20PresetMinterPauser(name, symbol) {
    _decimals = decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }
}
