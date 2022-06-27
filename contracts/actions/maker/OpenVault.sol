// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IManager.sol";
import "hardhat/console.sol";

import { OpenVaultData } from "../../core/Types.sol";

contract OpenVault is IAction {
  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {

    console.log('EXEC OPENING' );
    
    OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

    bytes32 vaultId = _openVault(openVaultData);

    console.log('VAULT CREATED', uint256(vaultId));
    
    push(vaultId);
  }

  function _openVault(OpenVaultData memory data) internal returns (bytes32) {
    bytes32 ilk = IJoin(data.joinAddress).ilk();
    uint256 vaultId = IManager(data.mcdManager).open(ilk, address(this));

    return bytes32(vaultId);
  }
}
