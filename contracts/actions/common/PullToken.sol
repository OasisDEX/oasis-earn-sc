pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import { PullTokenData } from "../../core/types/Common.sol";
import { OPERATION_STORAGE } from "../../core/Constants.sol";

contract PullToken is Executable {
  function execute(bytes calldata data, uint8[] memory) external payable override {
    PullTokenData memory pull = abi.decode(data, (PullTokenData));

    // TODO: Use OZ's safeTransferFrom
    IERC20(pull.asset).transferFrom(pull.from, address(this), pull.amount);
  }
}
