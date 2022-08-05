pragma solidity ^0.8.1;

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../core/types/Aave.sol";
import { AAVE_LENDING_POOL, WITHDRAW_ACTION } from "../../core/constants/Aave.sol";
import "hardhat/console.sol";

contract AaveWithdraw is Executable {
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    WithdrawData memory withdraw = abi.decode(data, (WithdrawData));
    console.log("STRAT WITHDRAW IN AAVE", withdraw.asset, withdraw.amount);
    
    (uint256 a,uint256 b,uint256 c,uint256 d,uint256 e,uint256 f) = ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).getUserAccountData(address(this));
    console.log("USER ACCOUNT DATA", a,b,c);
    console.log("USER ACCOUNT DATA", d,e,f);
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).withdraw(
      withdraw.asset,
      withdraw.amount,
      address(this)
    );
    console.log("END WITHDRAW IN AAVE", withdraw.asset, withdraw.amount);
    emit Action(WITHDRAW_ACTION, bytes32(withdraw.amount));
  }
}
