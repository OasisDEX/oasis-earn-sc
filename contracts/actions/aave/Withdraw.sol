pragma solidity ^0.8.1;

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../core/types/Aave.sol";
import { AAVE_LENDING_POOL, WITHDRAW_ACTION } from "../../core/constants/Aave.sol";

// TODO: Make it more generic so that anything could be withdrawn and not only ETH
contract AaveWithdraw is Executable {
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    WithdrawData memory withdraw = abi.decode(data, (WithdrawData));
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).withdraw(
      withdraw.asset,
      withdraw.amount,
      address(this)
    );
    // TODO: Assert that the funds are indeed in the account.
    emit Action(WITHDRAW_ACTION, bytes32(withdraw.amount));
  }
}
