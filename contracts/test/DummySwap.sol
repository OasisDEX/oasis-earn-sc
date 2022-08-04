pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "../actions/common/Executable.sol";
import { UseStore, Read, Write } from "../actions/common/UseStore.sol";

import "../interfaces/tokens/IERC20.sol";
import "../core/ServiceRegistry.sol";
import "../interfaces/tokens/IWETH.sol";
import "../interfaces/IExchange.sol";
import "../core/OperationStorage.sol";
import { SwapData } from "../core/types/Common.sol";

contract DummySwap is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  IWETH private immutable WETH;
  address private immutable exchange;

  constructor(
    address _registry,
    IWETH _weth,
    address _exchange
  ) UseStore(_registry) {
    WETH = _weth;
    exchange = _exchange;
  }

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SwapData memory swap = parseInputs(data);


    console.log('params MAP', paramsMap[2] );
    
    swap.amount = store().readUint(bytes32(swap.amount), paramsMap[2]);

    console.log('SWAP AMOUNT MAPPED', swap.amount );
    

    IERC20(swap.fromAsset).approve(exchange, swap.amount);

    if (address(this).balance > 0) {
      WETH.deposit{ value: address(this).balance }();
    }
    
    uint256 received = IExchange(exchange).swapTokenForToken(
      swap.fromAsset,
      swap.toAsset,
      swap.amount,
      swap.receiveAtLeast
    );

    uint256 balance = IERC20(swap.toAsset).balanceOf(address(this));


    console.log('swapped done', balance );
    
    require(received >= swap.receiveAtLeast, "Exchange / Received less");

    store().write(bytes32(balance));
  }

  function parseInputs(bytes memory _callData) public pure returns (SwapData memory params) {
    return abi.decode(_callData, (SwapData));
  }
}
