pragma solidity ^0.8.5;

import "hardhat/console.sol";

import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../libs/SafeMath.sol";
import "../../libs/SafeERC20.sol";
import { ONE_INCH_AGGREGATOR } from "../../core/constants/Common.sol";

error ReceivedLess(uint256 receiveAtLeast, uint256 received);
error Unauthorized();
error FeeTierDoesNotExist();
error SwapFailed();

contract Swap {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  address public feeBeneficiaryAddress;
  uint256 public constant feeBase = 10000;
  mapping(uint256 => bool) public feeTiers;
  mapping(address => bool) public authorizedAddresses;
  ServiceRegistry internal immutable registry;

  constructor(
    address authorisedCaller,
    address feeBeneficiary,
    uint256 _initialFee,
    address _registry
  ) {
    authorizedAddresses[authorisedCaller] = true;
    authorizedAddresses[feeBeneficiary] = true;
    addFeeTier(_initialFee);
    feeBeneficiaryAddress = feeBeneficiary;
    registry = ServiceRegistry(_registry);
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
    if (!authorizedAddresses[msg.sender]) {
      revert Unauthorized();
    }
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
    if (!valid) {
      revert FeeTierDoesNotExist();
    }
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
    if (!success) {
      revert SwapFailed();
    }
    balance = IERC20(toAsset).balanceOf(address(this));
    emit SlippageSaved(receiveAtLeast, balance);
    if (balance < receiveAtLeast) {
      revert ReceivedLess({ receiveAtLeast: receiveAtLeast, received: balance });
    }
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
    bytes calldata withData,
    bool collectFeeInFromToken
  ) public {
    IERC20(assetFrom).safeTransferFrom(msg.sender, address(this), amountFromWithFee);
    uint256 amountFrom = amountFromWithFee;
    if (collectFeeInFromToken) {
      amountFrom = _collectFee(assetFrom, amountFromWithFee, fee);
    }

    address oneInch = registry.getRegisteredService(ONE_INCH_AGGREGATOR);
    uint256 toTokenBalance = _swap(
      assetFrom,
      assetTo,
      amountFrom,
      receiveAtLeast,
      oneInch,
      withData
    );

    if (!collectFeeInFromToken) {
      toTokenBalance = _collectFee(assetTo, toTokenBalance, fee);
    }

    uint256 fromTokenBalance = IERC20(assetFrom).balanceOf(address(this));
    if (fromTokenBalance > 0) {
      IERC20(assetFrom).safeTransfer(msg.sender, fromTokenBalance);
    }

    IERC20(assetTo).safeTransfer(msg.sender, toTokenBalance);
  }
}
