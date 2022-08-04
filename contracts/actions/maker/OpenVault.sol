// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { OpenVaultData } from "../../core/types/Maker.sol";
import { OPEN_VAULT_ACTION, MCD_MANAGER } from "../../core/constants/Maker.sol";

contract MakerOpenVault is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

    bytes32 vaultId = _openVault(openVaultData);
    store().write(vaultId);

    emit Action(OPEN_VAULT_ACTION, vaultId);
  }

  function _openVault(OpenVaultData memory data) internal returns (bytes32) {
    bytes32 ilk = data.joinAddress.ilk();

    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    uint256 vaultId = manager.open(ilk, address(this));

    return bytes32(vaultId);
  }
}
