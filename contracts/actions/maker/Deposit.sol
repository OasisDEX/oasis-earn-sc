// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.15;
import "hardhat/console.sol";
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
import { DEPOSIT_ACTION } from "../../core/constants/Maker.sol";
import { MCD_MANAGER } from "../../core/constants/Maker.sol";

contract MakerDeposit is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory depositData = abi.decode(data, (DepositData));

    depositData.vaultId = store().readUint(bytes32(depositData.vaultId), paramsMap[1]);
    depositData.amount = store().readUint(bytes32(depositData.amount), paramsMap[2]);

    bytes32 amountDeposited = _deposit(depositData);
    store().write(amountDeposited);

    emit Action(DEPOSIT_ACTION, amountDeposited);
  }

  function _deposit(DepositData memory data) internal returns (bytes32) {
    address gem = data.joinAddress.gem();

    if (gem == registry.getRegisteredService(WETH)) {
      IWETH(gem).deposit{ value: address(this).balance }();
    }

    if (data.amount == type(uint256).max) {
      data.amount = IERC20(gem).balanceOf(address(this));
    }

    uint256 amountToDeposit = data.amount;

    IERC20(gem).safeApprove(address(data.joinAddress), amountToDeposit);
    data.joinAddress.join(address(this), amountToDeposit);

    uint256 convertedAmount = MathUtils.convertTo18(data.joinAddress, amountToDeposit);

    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    IVat vat = manager.vat();

    vat.frob(
      manager.ilks(data.vaultId),
      manager.urns(data.vaultId),
      address(this),
      address(this),
      MathUtils.uintToInt(convertedAmount),
      0
    );

    uint256 newBalance = IERC20(gem).balanceOf(address(this));

    return bytes32(convertedAmount);
  }
}
