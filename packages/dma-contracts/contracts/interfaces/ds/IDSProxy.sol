// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

interface IDSProxy {
  function owner() external returns (address);

  function execute(bytes memory, bytes memory) external payable returns (address, bytes memory);

  function execute(address, bytes memory) external payable returns (bytes memory);

  function setCache(address _cacheAddr) external returns (bool);
}

interface IDSAuthority {
  function canCall(address, address, bytes4) external view returns (bool);
}

interface IDSAuth {
  function authority() external returns (IDSAuthority);

  function setAuthority(IDSAuthority) external;
}

interface IDSGuard {
  function canCall(address, address, bytes4) external view returns (bool);

  function permit(address, address, bytes32) external;

  function forbid(address, address, bytes32) external;
}

interface IDSGuardFactory {
  function newGuard() external returns (IDSGuard);
}
