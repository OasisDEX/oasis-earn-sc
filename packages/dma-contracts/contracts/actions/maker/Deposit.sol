// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.15;

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
import { CDP_MANAGER } from "../../core/constants/Maker.sol";

import "hardhat/console.sol";

contract MakerDeposit is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory depositData = parseInputs(data);

    console.log('DEPO INIT' );
    
    depositData.vaultId = store().readUint(
      bytes32(depositData.vaultId),
      paramsMap[1],
      address(this)
    );
    depositData.amount = store().readUint(bytes32(depositData.amount), paramsMap[2], address(this));

    uint256 amountDeposited = _deposit(depositData);

    console.log('DEPO DONE' );
    
    store().write(bytes32(amountDeposited));
  }

  function _deposit(DepositData memory data) internal returns (uint256) {
    address gem = data.joinAddress.gem();

    console.log('DEPOSIT SCOPE ADDRESS', address(this) );
    
    console.log('GEM AMOUNT', IERC20(gem).balanceOf(address(this)) );
    
    if (data.amount == type(uint256).max) {
      data.amount = IERC20(gem).balanceOf(address(this));
    }

    IERC20(gem).safeApprove(address(data.joinAddress), data.amount);
    data.joinAddress.join(address(this), data.amount);

    uint256 convertedAmount = MathUtils.convertTo18(data.joinAddress, data.amount);

    IManager manager = IManager(registry.getRegisteredService(CDP_MANAGER));
    IVat vat = manager.vat();

    vat.frob(
      manager.ilks(data.vaultId),
      manager.urns(data.vaultId),
      address(this),
      address(this),
      MathUtils.uintToInt(convertedAmount),
      0
    );

    return convertedAmount;
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositData memory params) {
    return abi.decode(_callData, (DepositData));
  }
}
