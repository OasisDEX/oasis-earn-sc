pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { SwapData } from "../../core/types/Common.sol";
import { UseStore, Write } from "../../actions/common/UseStore.sol";
import { Swap } from "./Swap.sol";
import { WETH, SWAP } from "../../core/constants/Common.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import "hardhat/console.sol";
contract SwapAction is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    // TODO figure out why using ETH doesn't work.
    // - Failed on the swap. 1Inch has some EthReceiver contract which checks the tx.origin and msg.sender
    //   If they are different msg.sender != tx.origin the deposit/transfer of ETH is not accepted
    // - Forced to wrap the ETH into WETH
    // - There should be separate actions or utils to wrap/unwrap ETH into/from WETH
    address swapAddress = registry.getRegisteredService(SWAP);
    
    if (address(this).balance > 0) {
      IWETH(registry.getRegisteredService(WETH)).deposit{ value: address(this).balance }();
    } //TODO remove
    
    SwapData memory swap = abi.decode(data, (SwapData));

    console.log('swap.amount:', swap.amount);
    IERC20(swap.fromAsset).safeApprove(swapAddress, swap.amount);

    uint256 received = Swap(swapAddress).swapTokens(swap);

    store().write(bytes32(received));
  }
}
