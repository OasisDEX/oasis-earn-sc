pragma solidity ^0.8.1;

import "../../interfaces/tokens/IERC20.sol";
import "../../lib/SafeMath.sol";
import "../utils/SafeERC20.sol";
import "hardhat/console.sol";

contract Swap {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public feeBeneficiaryAddress;
    uint256[] public feeTiers;
    uint256 public constant feeBase = 10000;
    mapping(address => bool) public WHITELISTED_CALLERS;

    constructor(
        address authorisedCaller,
        address feeBeneficiary,
        uint256 _feeTier0
    ) {
        WHITELISTED_CALLERS[authorisedCaller] = true;
        WHITELISTED_CALLERS[feeBeneficiary] = true;
        addFeeTier(_feeTier0);
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
        require(WHITELISTED_CALLERS[msg.sender], "Swap / Unauthorized Caller.");
        _;
    }

    function addFeeTier(uint256 fee) public onlyAuthorised returns (uint256) {
        feeTiers.push(fee);
        return feeTiers.length;
    }

    function getFee(uint256 feeTierId) public view returns (uint256) {
        require(feeTiers.length > feeTierId, "Swap / Fee Tier does not exist.");
        return feeTiers[feeTierId];
    }

    function _transferIn(
        address from,
        address asset,
        uint256 amount
    ) internal {
        require(
            IERC20(asset).allowance(from, address(this)) >= amount,
            "Swap / Not enough allowance"
        );
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
    ) internal returns (uint256) {
        IERC20(fromAsset).safeApprove(callee, amount);
        (bool success, ) = callee.call(withData);
        require(success, "Swap / Could not swap");
        uint256 balance = IERC20(toAsset).balanceOf(address(this));
        emit SlippageSaved(receiveAtLeast, balance);
        require(balance >= receiveAtLeast, "Swap / Received less");
        emit AssetSwap(fromAsset, toAsset, amount, balance);
        return balance;
    }

    function _collectFee(
        address asset,
        uint256 fromAmount,
        uint256 feeTierId
    ) internal returns (uint256) {
        uint256 fee = getFee(feeTierId);
        uint256 feeToTransfer = (fromAmount.mul(fee)).div(fee.add(feeBase));

        if (fee > 0) {
            IERC20(asset).safeTransfer(feeBeneficiaryAddress, feeToTransfer);
            emit FeePaid(feeBeneficiaryAddress, feeToTransfer, asset);
        }

        return fromAmount.sub(feeToTransfer);
    }

    function swapTokens(
        address assetFrom,
        address assetTo,
        uint256 amountFromWithFee,
        uint256 receiveAtLeast,
        uint256 feeTierId,
        address callee,
        bytes calldata withData
    ) public {
        _transferIn(msg.sender, assetFrom, amountFromWithFee);
        uint256 amountFrom = _collectFee(
            assetFrom,
            amountFromWithFee,
            feeTierId
        );

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
