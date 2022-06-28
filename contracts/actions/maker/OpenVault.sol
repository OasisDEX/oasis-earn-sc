// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";

import { OpenVaultData } from "../../core/types/Maker.sol";

contract MakerOpenVault is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

    store().write(_openVault(openVaultData));
  }

  function _openVault(OpenVaultData memory data) internal returns (bytes32) {
    bytes32 ilk = data.joinAddress.ilk();
    uint256 vaultId = data.mcdManager.open(ilk, address(this));

    return bytes32(vaultId);
  }
}
