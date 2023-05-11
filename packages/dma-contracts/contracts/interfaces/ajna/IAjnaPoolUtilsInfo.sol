// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

interface IAjnaPoolUtilsInfo {
    function priceToIndex(
        uint256 price_
    ) external pure returns (uint256);

    function borrowerInfo(
        address pool_,
        address borrower_
    ) external view returns (
        uint256 debt_,
        uint256 collateral_,
        uint256 index_
    );
}
