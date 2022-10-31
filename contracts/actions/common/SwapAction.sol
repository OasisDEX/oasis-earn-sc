pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { SwapData } from "../../core/types/Common.sol";
import { UseStore, Write } from "../../actions/common/UseStore.sol";
import { Swap } from "./Swap.sol";
import { WETH, SWAP } from "../../core/constants/Common.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { SWAP } from "../../core/constants/Common.sol";
import "hardhat/console.sol";

/**
 * @title SwapAction Action contract
 * @notice Call the deployed Swap contract which handles swap execution
 */
contract SwapAction is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev The swap contract is pre-configured to use a specific exchange (EG 1inch)
   * @param data Encoded calldata that conforms to the SwapData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    address swapAddress = registry.getRegisteredService(SWAP);

    SwapData memory swap = parseInputs(data);

    console.log("swapAddress", swapAddress);
    console.log("swap.amount", swap.amount);
    console.log("address(this)", address(this));
    console.log("msg.sender", msg.sender);
    IERC20(swap.fromAsset).safeApprove(swapAddress, swap.amount);
    // console.log("entering swap");

    uint256 allowance = IERC20(swap.fromAsset).allowance(address(this), swapAddress);

    console.log("swap.fromAsset:", swap.fromAsset);
    console.log("allowance:", allowance);

    uint256 balance = IERC20(swap.fromAsset).balanceOf(msg.sender);
    uint256 balance2 = IERC20(swap.fromAsset).balanceOf(address(this));
    console.log("balance:", balance);
    console.log("balance2:", balance2);

    // IERC20(swap.fromAsset).safeTransferFrom(address(this), swapAddress, swap.amount);
    console.log("starting swap");
    uint256 received = Swap(swapAddress).swapTokens(swap);

    store().write(bytes32(received));

    emit Action(SWAP, bytes32(received));
  }

  function parseInputs(bytes memory _callData) public pure returns (SwapData memory params) {
    return abi.decode(_callData, (SwapData));
  }
}
