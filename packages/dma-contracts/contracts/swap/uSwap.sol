// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { ISwapRouter } from "../interfaces/common/ISwapRouter.sol";
import { IERC20 } from "../interfaces/tokens/IERC20.sol";
import { SafeERC20 } from "../libs/SafeERC20.sol";
import { UNISWAP_ROUTER } from "../core/constants/Common.sol";
import { SwapData } from "../core/types/Common.sol";

contract uSwap {
  using SafeERC20 for IERC20;

  address public feeBeneficiaryAddress;
  uint256 public constant feeBase = 10000;
  mapping(uint256 => bool) public feeTiers;
  mapping(address => bool) public authorizedAddresses;

  mapping(bytes32 => uint24) public pools;
  ServiceRegistry internal immutable registry;

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

  function setPool(address fromToken, address toToken, uint24 pool) public onlyAuthorised {
    pools[keccak256(abi.encodePacked(fromToken, toToken))] = pool;
    pools[keccak256(abi.encodePacked(toToken, fromToken))] = pool;
  }

  function getPool(address fromToken, address toToken) public view returns (uint24) {
    uint24 pool = pools[keccak256(abi.encodePacked(fromToken, toToken))];

    if (pool > 0) {
      return pool;
    } else {
      return 3000;
    }
  }

  function verifyFee(uint256 feeId) public view returns (bool valid) {
    valid = feeTiers[feeId];
  }

  function _swap(
    address fromAsset,
    address toAsset,
    uint256 amount,
    uint256 receiveAtLeast
  ) internal returns (uint256 balance) {
    ISwapRouter uniswap = ISwapRouter(registry.getRegisteredService(UNISWAP_ROUTER));

    IERC20(fromAsset).safeApprove(address(uniswap), amount);
    uint24 pool = getPool(fromAsset, toAsset);

    uniswap.exactInputSingle(
      ISwapRouter.ExactInputSingleParams({
        tokenIn: fromAsset,
        tokenOut: toAsset,
        amountIn: amount,
        amountOutMinimum: 0,
        fee: pool,
        recipient: address(this),
        deadline: block.timestamp + 15,
        sqrtPriceLimitX96: 0
      })
    );

    balance = IERC20(toAsset).balanceOf(address(this));

    if (balance == 0) {
      revert SwapFailed();
    }

    emit SlippageSaved(receiveAtLeast, balance);
    if (balance < receiveAtLeast) {
      revert ReceivedLess(receiveAtLeast, balance);
    }
    emit AssetSwap(fromAsset, toAsset, amount, balance);
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
    uint256 feeToTransfer = (fromAmount * fee)/(fee + feeBase);

    if (fee > 0) {
      IERC20(asset).safeTransfer(feeBeneficiaryAddress, feeToTransfer);
      emit FeePaid(feeBeneficiaryAddress, feeToTransfer, asset);
    }

    amount = fromAmount - feeToTransfer;
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

  function swapTokens(SwapData calldata swapData) public returns (uint256) {
    IERC20(swapData.fromAsset).safeTransferFrom(msg.sender, address(this), swapData.amount);

    uint256 amountFrom = swapData.amount;

    if (swapData.collectFeeInFromToken) {
      amountFrom = _collectFee(swapData.fromAsset, swapData.amount, swapData.fee);
    }

    uint256 toTokenBalance = _swap(
      swapData.fromAsset,
      swapData.toAsset,
      amountFrom,
      swapData.receiveAtLeast
    );

    uint256 receiveAtLeastFromCallData = decodeOneInchCallData(swapData.withData);

    if (receiveAtLeastFromCallData > toTokenBalance) {
      revert ReceivedLess(receiveAtLeastFromCallData, swapData.receiveAtLeast);
    }

    if (!swapData.collectFeeInFromToken) {
      toTokenBalance = _collectFee(swapData.toAsset, toTokenBalance, swapData.fee);
    }

    uint256 fromTokenBalance = IERC20(swapData.fromAsset).balanceOf(address(this));
    if (fromTokenBalance > 0) {
      IERC20(swapData.fromAsset).safeTransfer(msg.sender, fromTokenBalance);
    }

    IERC20(swapData.toAsset).safeTransfer(msg.sender, toTokenBalance);
    return toTokenBalance;
  }
}
