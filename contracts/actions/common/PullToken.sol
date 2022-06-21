pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import { PullTokenData } from "../../core/types/Common.sol";
import { PULL_TOKEN_ACTION, NULL } from "../../core/constants/Common.sol";

contract PullToken is Executable {
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    PullTokenData memory pull = abi.decode(data, (PullTokenData));

    // TODO: Use OZ's safeTransferFrom
    IERC20(pull.asset).transferFrom(pull.from, address(this), pull.amount);
    emit Action(PULL_TOKEN_ACTION, data, paramsMap, NULL);
  }
}
