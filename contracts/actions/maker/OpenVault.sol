// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IManager.sol";

import { OpenVaultData } from "../../core/types/Maker.sol";

contract MakerOpenVault is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

    store().write(_openVault(openVaultData));
  }

  function _openVault(OpenVaultData memory data) internal returns (bytes32) {
    bytes32 ilk = IJoin(data.joinAddress).ilk();
    uint256 vaultId = IManager(data.mcdManager).open(ilk, address(this));

    return bytes32(vaultId);
  }
}
