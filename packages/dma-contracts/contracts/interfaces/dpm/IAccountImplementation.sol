// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.15;

interface IAccountImplementation {
  function execute(address _target, bytes memory _data) external payable returns (bytes32 response);

  function send(address _target, bytes memory _data) external payable;

  function owner() external view returns (address owner);

  function guard() external returns (address);
}
