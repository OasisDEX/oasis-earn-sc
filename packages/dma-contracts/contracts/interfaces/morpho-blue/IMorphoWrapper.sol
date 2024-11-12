// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.0;

interface IMorphoWrapper {
  function depositFor(address account, uint256 value) external returns (bool);

  function withdrawTo(address account, uint256 value) external returns (bool);

  function underlying() external pure returns (address);
}
