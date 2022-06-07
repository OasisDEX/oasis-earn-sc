pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/Constants.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/IVariableDebtToken.sol";
import "../../interfaces/aave/IWETHGateway.sol";
import { AAVEBorrowData } from "../../core/Types.sol";
import { OPERATION_STORAGE, AAVE_WETH_GATEWAY, AAVE_LENDING_POOL } from "../../core/Constants.sol";

// TODO: Make it more generic so that anything could be withdrawn and not only ETH
contract BorrowFromAAVE is IAction {
  // This will be removed once I make it more generic
  IVariableDebtToken public constant dWETH =
    IVariableDebtToken(0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf);

  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    AAVEBorrowData memory borrow = abi.decode(data, (AAVEBorrowData));
    address wethGatewayAddress = registry.getRegisteredService(AAVE_WETH_GATEWAY);
    dWETH.approveDelegation(wethGatewayAddress, borrow.amount);
    IWETHGateway(wethGatewayAddress).borrowETH(
      registry.getRegisteredService(AAVE_LENDING_POOL),
      borrow.amount,
      2,
      0
    );
    // TODO: REMOVE
    storeResult("BorrowFromAAVE");
  }
}
