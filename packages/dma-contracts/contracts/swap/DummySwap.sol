// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { ISwapRouter } from "../interfaces/common/ISwapRouter.sol";
import { IERC20 } from "../interfaces/tokens/IERC20.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { SafeERC20 } from "../libs/SafeERC20.sol";
import { UNISWAP_ROUTER } from "../core/constants/Common.sol";
import { SwapData } from "../core/types/Common.sol";

import "hardhat/console.sol";

contract DummySwap {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  address public feeBeneficiaryAddress;
  uint256 public constant feeBase = 10000;
  mapping(uint256 => bool) public feeTiers;
  mapping(address => bool) public authorizedAddresses;

  mapping(bytes32 => uint24) public pools;
  ServiceRegistry internal immutable registry;

  mapping(address => uint8) public precisions;
  mapping(address => uint256) public prices;

  error ReceivedLess(uint256 receiveAtLeast, uint256 received);
  error Unauthorized();
  error FeeTierDoesNotExist(uint256 fee);
  error FeeTierAlreadyExists(uint256 fee);
  error SwapFailed();

  constructor(
    address authorisedCaller,
    address feeBeneficiary,
    uint256 _initialFee,
    address _registry
  ) {

    console.log('DUMMY SWAPP CREATION' );
    
    authorizedAddresses[authorisedCaller] = true;
    authorizedAddresses[feeBeneficiary] = true;
    _addFeeTier(_initialFee);
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
  event FeeTierAdded(uint256 fee);
  event FeeTierRemoved(uint256 fee);

  struct SwapDescription {
    IERC20 srcToken;
    IERC20 dstToken;
    address payable srcReceiver;
    address payable dstReceiver;
    uint256 amount;
    uint256 minReturnAmount;
    uint256 flags;
    bytes permit;
  }

  modifier onlyAuthorised() {
    if (!authorizedAddresses[msg.sender]) {
      revert Unauthorized();
    }
    _;
  }

  function setPrecision(address token, uint8 _precision) public {
    precisions[token] = _precision;
  }

  function setPrice(address token, uint256 p) public {
    prices[token] = p;
  }

  function _addFeeTier(uint256 fee) private {
    if (feeTiers[fee]) {
      revert FeeTierAlreadyExists(fee);
    }
    feeTiers[fee] = true;
    emit FeeTierAdded(fee);
  }

  function addFeeTier(uint256 fee) public onlyAuthorised {
    _addFeeTier(fee);
  }

  function removeFeeTier(uint256 fee) public onlyAuthorised {
    if (!feeTiers[fee]) {
      revert FeeTierDoesNotExist(fee);
    }
    feeTiers[fee] = false;
    emit FeeTierRemoved(fee);
  }

  function verifyFee(uint256 feeId) public view returns (bool valid) {
    valid = feeTiers[feeId];
  }

  function _collectFee(
    address asset,
    uint256 fromAmount,
    uint256 fee
  ) internal returns (uint256 amount) {
    bool isFeeValid = verifyFee(fee);
    if (!isFeeValid) {
      revert FeeTierDoesNotExist(fee);
    }
    uint256 feeToTransfer = fromAmount.mul(fee).div(fee.add(feeBase));

    if (fee > 0) {
      IERC20(asset).safeTransfer(feeBeneficiaryAddress, feeToTransfer);
      emit FeePaid(feeBeneficiaryAddress, feeToTransfer, asset);
    }

    amount = fromAmount.sub(feeToTransfer);
  }

  function compareMethodSigs(bytes memory a, bytes memory b) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(bytes4(keccak256(b))));
  }

  function decodeOneInchCallData(bytes calldata withData) public pure returns (uint256 minReturn) {
    bytes memory uniswapV3Swap = "uniswapV3Swap(uint256,uint256,uint256[])";
    bytes memory unoswap = "unoswap(address,uint256,uint256,bytes32[])";
    bytes
      memory swap = "swap(address,(address,address,address,address,uint256,uint256,uint256,bytes),bytes)";

    if (withData.length < 4) {
      minReturn = 0;
      return minReturn;
    }

    bytes memory methodSig = withData[:4];

    if (compareMethodSigs(methodSig, uniswapV3Swap)) {
      (, uint256 _minReturn, ) = abi.decode(withData[4:], (uint256, uint256, uint256[]));
      minReturn = _minReturn;
    } else if (compareMethodSigs(methodSig, unoswap)) {
      (, , uint256 _minReturn, ) = abi.decode(withData[4:], (address, uint256, uint256, bytes32[]));
      minReturn = _minReturn;
    } else if (compareMethodSigs(methodSig, swap)) {
      (, SwapDescription memory swapDescription, ) = abi.decode(
        withData[4:],
        (address, SwapDescription, bytes)
      );
      minReturn = swapDescription.minReturnAmount;
    } else {
      // Im not sure whether this is the best way to handle this
      minReturn = 0;
    }
  }

  function _transferIn(address from, address asset, uint256 amount) internal {
    require(
      IERC20(asset).allowance(from, address(this)) >= amount,
      "Exchange / Not enought allowance"
    );

    IERC20(asset).safeTransferFrom(from, address(this), amount);
  }

  function _transferOut(address asset, address to, uint256 amount) internal {
    IERC20(asset).safeTransfer(to, amount);
    emit SlippageSaved(amount, amount);
  }


  function swapTokens(SwapData calldata swapData) public returns (uint256) {

    console.log("swapTokens", swapData.fromAsset);

    return 0;
    // IERC20(swapData.fromAsset).safeTransferFrom(msg.sender, address(this), swapData.amount);

    // uint256 amountFrom = swapData.amount;

    // if (swapData.collectFeeInFromToken) {
    //   amountFrom = _collectFee(swapData.fromAsset, swapData.amount, swapData.fee);
    // }

    //  uint8 precision = precisions[swapData.fromAsset];
    // // amount = _collectFee(DAI_ADDRESS, amount);
    // uint256 amountTo = ((amountFrom * (10 ** 18)) / prices[swapData.toAsset]) / (10 ** (18 - precision));
    // _transferIn(msg.sender, swapData.fromAsset, amountFrom);
    // _transferOut(swapData.toAsset, msg.sender, amountTo);

    // uint256 toTokenBalance = amountTo;

    // uint256 receiveAtLeastFromCallData = decodeOneInchCallData(swapData.withData);

    // if (receiveAtLeastFromCallData > toTokenBalance) {
    //   revert ReceivedLess(receiveAtLeastFromCallData, swapData.receiveAtLeast);
    // }

    // if (!swapData.collectFeeInFromToken) {
    //   toTokenBalance = _collectFee(swapData.toAsset, toTokenBalance, swapData.fee);
    // }

    // uint256 fromTokenBalance = IERC20(swapData.fromAsset).balanceOf(address(this));
    // if (fromTokenBalance > 0) {
    //   IERC20(swapData.fromAsset).safeTransfer(msg.sender, fromTokenBalance);
    // }

    // IERC20(swapData.toAsset).safeTransfer(msg.sender, toTokenBalance);
    // return toTokenBalance;
  }
}
