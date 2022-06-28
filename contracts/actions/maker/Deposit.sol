// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { DepositData } from "../../core/types/Maker.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { WETH } from "../../core/constants/Common.sol";
import { MCD_MANAGER } from "../../core/constants/Maker.sol";

contract MakerDeposit is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory depositData = abi.decode(data, (DepositData));
    depositData.vaultId = store().readUint(bytes32(depositData.vaultId), paramsMap[0]);
    store().write(_deposit(depositData));
  }

  function _deposit(DepositData memory data) internal returns (bytes32) {
    address gem = data.joinAddress.gem();

    if (address(gem) == registry.getRegisteredService(WETH)) {
      // gem.deposit{ value: msg.value }(); // no longer in msg.value, because of the flashloan callback
      IWETH(gem).deposit{ value: address(this).balance }();
    }

    uint256 balance = IERC20(gem).balanceOf(address(this));

    IERC20(gem).safeApprove(address(data.joinAddress), balance);
    data.joinAddress.join(address(this), balance);

    uint256 convertedAmount = MathUtils.convertTo18(data.joinAddress, balance);

    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    IVat vat = IVat(manager.vat());

    vat.frob(
      manager.ilks(data.vaultId),
      manager.urns(data.vaultId),
      address(this),
      address(this),
      MathUtils.uintToInt(convertedAmount),
      0
    );

    return bytes32(convertedAmount);
  }
}
