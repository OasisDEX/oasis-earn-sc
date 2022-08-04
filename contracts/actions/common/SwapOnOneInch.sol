pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { SwapData } from "../../core/types/Common.sol";
import { WETH, ONE_INCH_AGGREGATOR } from "../../core/constants/Common.sol";

// TODO: Make it so it differentiate between ETH and any other token
contract SwapOnOneInch is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(ServiceRegistry _registry) UseStore(address(_registry)) {}

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

    IERC20(swap.fromAsset).safeApprove(oneInchAggregatorAddress, swap.amount);

    (bool success, ) = oneInchAggregatorAddress.call(swap.withData);

    require(success, "Exchange / Could not swap");
    uint256 balance = IERC20(swap.toAsset).balanceOf(address(this));
    store().write(bytes32(balance));
    require(balance >= swap.receiveAtLeast, "Exchange / Received less");
  }
}
