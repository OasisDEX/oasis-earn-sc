pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { WrapEthData } from "../../core/types/Common.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { WETH } from "../../core/constants/Common.sol";
import { WRAP_ETH_ACTION } from "../../core/constants/Common.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";

contract WrapEth is Executable, UseStore {
  using Write for OperationStorage;
  using SafeERC20 for IERC20;

  constructor(address _registry) UseStore(_registry) {}
 
  function execute(bytes calldata data, uint8[] memory) external payable override {
    WrapEthData memory wrapEthData = parseInputs(data);

    if (wrapEthData.amount == type(uint256).max) {
        wrapEthData.amount = address(this).balance;
    }

    IWETH(registry.getRegisteredService(WETH)).deposit{value: wrapEthData.amount}();

    store().write(bytes32(wrapEthData.amount));
    emit Action(WRAP_ETH_ACTION, bytes32(wrapEthData.amount));

  }

  function parseInputs(bytes memory _callData) public pure returns (WrapEthData memory params) {
    return abi.decode(_callData, (WrapEthData));
  }
}