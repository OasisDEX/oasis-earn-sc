//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.15;

import "./DSGuard.sol";
import "./DSAuth.sol";

import { FlashloanData } from "../../core/types/Common.sol";
import { IAccountImplementation } from "../../interfaces/dpm/IAccountImplementation.sol";
import { IAccountGuard } from "../../interfaces/dpm/IAccountGuard.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { DS_GUARD_FACTORY } from "../../core/constants/Common.sol";

contract ProxyPermission {
  ServiceRegistry internal immutable registry;
  bytes4 public constant ALLOWED_METHOD_HASH = bytes4(keccak256("execute(address,bytes)"));

  constructor(ServiceRegistry serviceRegistry) {
    registry = serviceRegistry;
  }

  function givePermission(bool isDPMProxy, address _contractAddr) public {
    if (isDPMProxy) {
      // DPM permission
      IAccountGuard(IAccountImplementation(address(this)).guard()).permit(
        _contractAddr,
        address(this),
        true
      );
    } else {
      // DSProxy permission
      address currAuthority = address(DSAuth(address(this)).authority());
      DSGuard guard = DSGuard(currAuthority);
      if (currAuthority == address(0)) {
        guard = DSGuardFactory(registry.getRegisteredService(DS_GUARD_FACTORY)).newGuard();
        DSAuth(address(this)).setAuthority(DSAuthority(address(guard)));
      }

      if (!guard.canCall(_contractAddr, address(this), ALLOWED_METHOD_HASH)) {
        guard.permit(_contractAddr, address(this), ALLOWED_METHOD_HASH);
      }
    }
  }

  function removePermission(bool isDPMProxy, address _contractAddr) public {
    if (isDPMProxy) {
      // DPM permission
      IAccountGuard(IAccountImplementation(address(this)).guard()).permit(
        _contractAddr,
        address(this),
        false
      );
    } else {
      // DSProxy permission
      address currAuthority = address(DSAuth(address(this)).authority());
      if (currAuthority == address(0)) {
        return;
      }
      DSGuard guard = DSGuard(currAuthority);
      guard.forbid(_contractAddr, address(this), ALLOWED_METHOD_HASH);
    }
  }
}
