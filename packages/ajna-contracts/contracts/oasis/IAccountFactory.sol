// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

interface IAccountFactory {
    //mapping(uint256 => address) public accounts;

    function createAccount() external returns (address clone);

    function createAccount(address user) external returns (address);

    event AccountCreated(address indexed proxy, address indexed user, uint256 indexed vaultId);
}
