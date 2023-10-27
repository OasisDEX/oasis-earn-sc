// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

interface IMockExchange {
  // EVENTS
  event AssetSwap(
    address indexed assetIn,
    address indexed assetOut,
    uint256 amountIn,
    uint256 amountOut
  );

  event FeePaid(address indexed beneficiary, uint256 amount);

  // ERRORS
  error InsufficientAllowance(uint256 allowance, uint256 amount);

  // MUTATING FUNCTIONS
  function setPrice(address token, uint256 p) external;

  function setFee(uint256 fee_) external;

  function swap(
    address assetFrom,
    address assetTo,
    uint256 amountIn,
    bool feeOnTransfer
  ) external returns (uint256 amountOut, uint256 feeAmount);

  // VIEW FUNCTIONS
  function calculateOutputAmount(
    address assetFrom,
    address assetTo,
    uint256 amount,
    bool feeOnTransfer
  ) external view returns (uint256 finalAmountOut, uint256 feeAmount);
}
