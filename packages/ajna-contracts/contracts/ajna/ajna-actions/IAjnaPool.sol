// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IAjnaPool {
    function collateralScale() external pure returns (uint256);

    function quoteTokenScale() external pure returns (uint256);

    /***********************************/
    /*** Borrower External Functions ***/
    /***********************************/

    function drawDebt(
        address borrowerAddress_,
        uint256 amountToBorrow_,
        uint256 limitIndex_,
        uint256 collateralToPledge_
    ) external;

    function repayDebt(
        address borrowerAddress_,
        uint256 maxQuoteTokenAmountToRepay_,
        uint256 collateralAmountToPull_
    ) external;

    /*********************************/
    /*** Lender External Functions ***/
    /*********************************/

    function addCollateral(
        uint256 collateralAmountToAdd_,
        uint256 index_
    ) external returns (uint256 bucketLPs_);

    function addQuoteToken(
        uint256 collateralAmountToAdd_,
        uint256 index_
    ) external returns (uint256 bucketLPs_);

    function removeCollateral(
        uint256 maxAmount_,
        uint256 index_
    ) external returns (uint256 collateralAmount_, uint256 lpAmount_);

    function removeQuoteToken(
        uint256 maxAmount_,
        uint256 index_
    ) external returns (uint256 collateralAmount_, uint256 lpAmount_);

    /**
     *  @notice Returns the address of the pool's collateral token
     */
    function collateralAddress() external pure returns (address);

    /**
     *  @notice Returns the address of the pools quote token
     */
    function quoteTokenAddress() external pure returns (address);

    function lenderInfo(
        uint256 index_,
        address lender_
    ) external view returns (uint256, uint256);

    function approveLpOwnership(
        address allowedNewOwner,
        uint256 index,
        uint256 amount
    ) external;

    function currentBurnEpoch() external view returns (uint256);

    function moveQuoteToken(
        uint256 maxAmount,
        uint256 fromIndex,
        uint256 toIndex
    ) external returns (uint256 lpbAmountFrom, uint256 lpbAmountTo);
}
