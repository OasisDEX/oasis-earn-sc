// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { WithdrawData } from "../../core/types/Maker.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";

contract MakerWithdraw is Executable, UseStore {
  using Read for OperationStorage;
  using Write for OperationStorage;
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // TODO:

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory _paramsMapping) external payable override {
    WithdrawData memory withdrawData = abi.decode(data, (WithdrawData));
    withdrawData.vaultId = store().readUint(bytes32(withdrawData.vaultId), _paramsMapping[0]);
    store().write(_withdraw(withdrawData));
  }

  function _withdraw(WithdrawData memory data) internal returns (bytes32) {
    address gem = data.joinAddr.gem();
    uint256 convertedAmount = MathUtils.convertTo18(data.joinAddr, data.amount);

    // Unlocks WETH/GEM amount from the CDP
    data.mcdManager.frob(data.vaultId, -MathUtils.uintToInt(convertedAmount), 0);

    // Moves the amount from the CDP urn to proxy's address
    data.mcdManager.flux(data.vaultId, address(this), convertedAmount);

    // Exits token/WETH amount to the user's wallet as a token
    data.joinAddr.exit(address(this), convertedAmount);

    if (address(gem) == WETH) {
      // Converts WETH to ETH
      IWETH(gem).withdraw(convertedAmount);
      // Sends ETH back to the user's wallet
      payable(data.userAddress).transfer(convertedAmount); // TODO:
    }

    return bytes32(convertedAmount);
  }
}
