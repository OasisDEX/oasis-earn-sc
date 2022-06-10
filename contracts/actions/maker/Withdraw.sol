// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import "../common/Executable.sol";
import "../common/UseStore.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/maker/IVat.sol";
import "../../interfaces/maker/IDaiJoin.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IGem.sol";
import "../../interfaces/maker/IManager.sol";
import "../../libs/SafeMath.sol";

import { WithdrawData } from "../../core/types/Maker.sol";

contract Withdraw is Executable, UseStore {
  using SafeMath for uint256;
  using Read for OperationStorage;
  using Write for OperationStorage;
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory _paramsMapping) external payable override {
    WithdrawData memory withdrawData = abi.decode(data, (WithdrawData));
    withdrawData.vaultId = uint256(store().read(bytes32(withdrawData.vaultId), _paramsMapping[0]));
    store().write(_withdraw(withdrawData));
  }

  function _withdraw(WithdrawData memory data) internal returns (bytes32) {
    IGem gem = IJoin(data.joinAddr).gem();
    IManager manager = IManager(data.mcdManager);
    uint256 convertedAmount = convertTo18(data.joinAddr, data.amount);

    // Unlocks WETH/GEM amount from the CDP
    manager.frob(data.vaultId, -toInt(convertedAmount), 0);

    // Moves the amount from the CDP urn to proxy's address
    manager.flux(data.vaultId, address(this), convertedAmount);

    // Exits token/WETH amount to the user's wallet as a token
    IGem(data.joinAddr).exit(address(this), convertedAmount);

    if (address(gem) == WETH) {
      // Converts WETH to ETH
      IGem(data.joinAddr).gem().withdraw(convertedAmount);
      // Sends ETH back to the user's wallet
      payable(data.userAddress).transfer(convertedAmount);
    }

    return bytes32(convertedAmount);
  }

  function toInt(uint256 x) internal pure returns (int256 y) {
    y = int256(x);
    require(y >= 0, "int-overflow");
  }

  function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
    require(y == 0 || (z = x * y) / y == x, "mul-overflow");
  }

  function convertTo18(address gemJoin, uint256 amt) internal view returns (uint256 wad) {
    // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
    // Adapters will automatically handle the difference of precision
    wad = amt.mul(10**(18 - IJoin(gemJoin).dec()));
  }
}
