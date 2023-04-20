// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Read, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IVat } from "../../interfaces/maker/IVat.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { MathUtils } from "../../libs/MathUtils.sol";
import { CdpAllowData } from "../../core/types/Maker.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { WETH } from "../../core/constants/Common.sol";
import { MCD_MANAGER } from "../../core/constants/Maker.sol";

contract CdpAllow is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    CdpAllowData memory cdpAllowData = parseInputs(data);
    cdpAllowData.vaultId = store().readUint(
      bytes32(cdpAllowData.vaultId),
      paramsMap[0],
      address(this)
    );

    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));

    manager.cdpAllow(cdpAllowData.vaultId, cdpAllowData.userAddress, 1);
  }

  function parseInputs(bytes memory _callData) public pure returns (CdpAllowData memory params) {
    return abi.decode(_callData, (CdpAllowData));
  }
}
