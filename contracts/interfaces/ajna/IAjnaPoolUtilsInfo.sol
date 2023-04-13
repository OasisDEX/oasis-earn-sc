// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IAjnaPoolUtilsInfo {
    function priceToIndex(
        uint256 price_
    ) external pure returns (uint256);
}
