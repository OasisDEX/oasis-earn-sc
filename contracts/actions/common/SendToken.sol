pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import { SendTokenData } from "../../core/types/Common.sol";
import { OPERATION_STORAGE } from "../../core/Constants.sol";

// TODO: Be able to differentiate between ETH and ERC20 tokens
contract SendToken is Executable {
  function execute(bytes calldata data, uint8[] memory) external payable override {
    SendTokenData memory send = abi.decode(data, (SendTokenData));

    // TODO: Use OZ's safeTransfer
    IERC20(send.asset).transfer(send.to, send.amount);
  }
}
