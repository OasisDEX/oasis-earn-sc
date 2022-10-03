//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IServiceRegistry {
    function getRegisteredService(string memory)
        external
        view
        returns (address);
}
