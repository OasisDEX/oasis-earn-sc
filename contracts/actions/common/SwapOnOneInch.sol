pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/tokens/IWETH.sol";
import { SwapData } from "../../core/types/Common.sol";
import { WETH, ONE_INCH_AGGREGATOR } from "../../core/constants/Common.sol";

// TODO: Make it so it differentiate between ETH and any other token
contract SwapOnOneInch is Executable {
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    // TODO figure out why using ETH doesn't work.
    // - Failed on the swap. 1Inch has some EthReceiver contract which checks the tx.origin and msg.sender
    //   If they are different msg.sender != tx.origin the deposit/transfer of ETH is not accepted
    // - Forced to wrap the ETH into WETH
    // - There should be separate actions or utils to wrap/unwrap ETH into/from WETH
    address oneInchAggregatorAddress = registry.getRegisteredService(ONE_INCH_AGGREGATOR);

    if (address(this).balance > 0) {
      IWETH(registry.getRegisteredService(WETH)).deposit{ value: address(this).balance }();
    }

    SwapData memory swap = abi.decode(data, (SwapData));

    IERC20(swap.fromAsset).approve(oneInchAggregatorAddress, swap.amount);

    (bool success, ) = oneInchAggregatorAddress.call(swap.withData);

    require(success, "Exchange / Could not swap");
    uint256 balance = IERC20(swap.toAsset).balanceOf(address(this));
    require(balance >= swap.receiveAtLeast, "Exchange / Received less");
  }
}
