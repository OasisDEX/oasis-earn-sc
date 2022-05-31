pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "./ActionBase.sol";

import "../../ServiceRegistry.sol";
import "../../interfaces/IERC20.sol";
import "../../interfaces/IWETH.sol";
import "../../interfaces/exchange/IExchange.sol";
import "../Types.sol";

// TODO: Make it so it differentiate between ETH and any other token
contract Swap is ActionBase {
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

  function executeAction(
    bytes[] memory _callData,
    uint256[] memory _paramsMapping,
    bytes32[] memory _returnValues,
    uint256 fee
  ) public payable override returns (bytes32) {
    SwapData memory swapData = parseInputs(_callData);

    IERC20(swapData.fromAsset).approve(exchange, swapData.amount);

    // TOOD: Replace with real implementation
    // Draw is generated and sent to msg.sender NOT to address(this)
    IExchange(exchange).swapDaiForToken(
      swapData.toAsset,
      swapData.amount,
      swapData.receiveAtLeast,
      exchange,
      swapData.withData
    );

    // TODO: Replace with the following line once using 1inch
    // (bool success, ) = exchange.call(swapData.withData);
    // console.log("Swap successful", success);
    // require(success, "Exchange / Could not swap");

    uint256 balance = IERC20(swapData.toAsset).balanceOf(address(this));
    require(balance >= swapData.receiveAtLeast, "Exchange / Received less");

    return bytes32(balance);
  }

  function actionType() public pure override returns (uint8) {
    return uint8(ActionType.DEFAULT);
  }

  function parseInputs(bytes[] memory _callData) internal pure returns (SwapData memory swapData) {
    swapData = abi.decode(_callData[0], (SwapData));
  }
}
