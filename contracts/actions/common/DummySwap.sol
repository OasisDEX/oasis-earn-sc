pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";

import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/tokens/IWETH.sol";
import "../../interfaces/IExchange.sol";
import { SwapData } from "../../core/types/Common.sol";

contract DummySwap is Executable {
  ServiceRegistry public immutable registry;
  IWETH private immutable WETH;
  address private immutable exchange;

  constructor(
    address _registry,
    IWETH _weth,
    address _exchange
  ) {
    registry = ServiceRegistry(_registry);
    WETH = _weth;
    exchange = _exchange;
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    SwapData memory swap = abi.decode(data, (SwapData));
    IERC20(swap.fromAsset).approve(exchange, swap.amount);

    // TOOD: Replace with real implementation
    // Draw is generated and sent to msg.sender NOT to address(this)
    IExchange(exchange).swapDaiForToken(
      swap.toAsset,
      swap.amount,
      swap.receiveAtLeast,
      exchange,
      swap.withData
    );

    // TODO: Replace with the following line once using 1inch
    // (bool success, ) = exchange.call(swapData.withData);
    // console.log("Swap successful", success);
    // require(success, "Exchange / Could not swap");

    uint256 balance = IERC20(swap.toAsset).balanceOf(address(this));

    require(balance >= swap.receiveAtLeast, "Exchange / Received less");
  }
}
