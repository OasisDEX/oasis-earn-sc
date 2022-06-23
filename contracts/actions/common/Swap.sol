pragma solidity ^0.8.1;

import "hardhat/console.sol";

import "../../interfaces/tokens/IERC20.sol";
import "../../libs/SafeMath.sol";
import "../../libs/SafeERC20.sol";

contract Swap {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  address public feeBeneficiaryAddress;
  uint256 public constant feeBase = 10000;
  mapping(uint256 => bool) public feeTiers;
  mapping(address => bool) public authorizedAddresses;

  constructor(
    address authorisedCaller,
    address feeBeneficiary,
    uint256 _initialFee
  ) {
    authorizedAddresses[authorisedCaller] = true;
    authorizedAddresses[feeBeneficiary] = true;
    addFeeTier(_initialFee);
    feeBeneficiaryAddress = feeBeneficiary;
  }

  event AssetSwap(
    address indexed assetIn,
    address indexed assetOut,
    uint256 amountIn,
    uint256 amountOut
  );

  event FeePaid(address indexed beneficiary, uint256 amount, address token);
  event SlippageSaved(uint256 minimumPossible, uint256 actualAmount);

  modifier onlyAuthorised() {
    require(authorizedAddresses[msg.sender], "Swap / Unauthorized Caller.");
    _;
  }

  function addFeeTier(uint256 fee) public onlyAuthorised {
    feeTiers[fee] = true;
  }

  function removeFeeTier(uint256 fee) public onlyAuthorised {
    feeTiers[fee] = false;
  }

  function verifyFee(uint256 feeId) public view returns (bool valid) {
    valid = feeTiers[feeId];
    require(valid, "Swap / Fee Tier does not exist.");
  }

  function _transferIn(
    address from,
    address asset,
    uint256 amount
  ) internal {
    IERC20(asset).safeTransferFrom(from, address(this), amount);
  }

  function _transferOut(
    address asset,
    address to,
    uint256 amount
  ) internal {
    IERC20(asset).safeTransfer(to, amount);
  }

  function _swap(
    address fromAsset,
    address toAsset,
    uint256 amount,
    uint256 receiveAtLeast,
    address callee,
    bytes calldata withData
  ) internal returns (uint256 balance) {
    IERC20(fromAsset).safeApprove(callee, amount);
    (bool success, ) = callee.call(withData);
    require(success, "Swap / Could not swap");
    balance = IERC20(toAsset).balanceOf(address(this));
    emit SlippageSaved(receiveAtLeast, balance);
    require(balance >= receiveAtLeast, "Swap / Received less");
    emit AssetSwap(fromAsset, toAsset, amount, balance);
  }

  function _collectFee(
    address asset,
    uint256 fromAmount,
    uint256 fee
  ) internal returns (uint256 remainedAmount) {
    verifyFee(fee);
    uint256 feeToTransfer = fromAmount.mul(fee).div(fee.add(feeBase));

    if (fee > 0) {
      IERC20(asset).safeTransfer(feeBeneficiaryAddress, feeToTransfer);
      emit FeePaid(feeBeneficiaryAddress, feeToTransfer, asset);
    }

    remainedAmount = fromAmount.sub(feeToTransfer);
  }

  function swapTokens(
    address assetFrom,
    address assetTo,
    uint256 amountFromWithFee,
    uint256 receiveAtLeast,
    uint256 fee,
    address callee,
    bytes calldata withData
  ) public {
    _transferIn(msg.sender, assetFrom, amountFromWithFee);
    uint256 amountFrom = _collectFee(assetFrom, amountFromWithFee, fee);

    uint256 toTokenBalance = _swap(
      assetFrom,
      assetTo,
      amountFrom,
      receiveAtLeast,
      callee,
      withData
    );

    uint256 fromTokenBalance = IERC20(assetFrom).balanceOf(address(this));
    if (fromTokenBalance > 0) {
      _transferOut(assetFrom, msg.sender, fromTokenBalance);
    }

    _transferOut(assetTo, msg.sender, toTokenBalance);
  }
}
