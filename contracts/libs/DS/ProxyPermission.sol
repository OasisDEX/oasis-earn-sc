//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.15;

import { FlashloanData } from "../../core/types/Common.sol";
import { IAccountImplementation } from "../../interfaces/dpm/IAccountImplementation.sol";
import { IAccountGuard } from "../../interfaces/dpm/IAccountGuard.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { DS_GUARD_FACTORY } from "../../core/constants/Common.sol";
import { IDSGuardFactory, IDSGuard, IDSAuth, IDSAuthority } from "../../interfaces/ds/IDSProxy.sol";

contract ProxyPermission {
  IDSGuardFactory internal immutable dsGuardFactory;
  bytes4 public constant ALLOWED_METHOD_HASH = bytes4(keccak256("execute(address,bytes)"));

  constructor(address _dsGuardFactory) {
    dsGuardFactory = IDSGuardFactory(_dsGuardFactory);
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
      address currAuthority = address(IDSAuth(address(this)).authority());
      IDSGuard guard = IDSGuard(currAuthority);
      if (currAuthority == address(0)) {
        guard = dsGuardFactory.newGuard();
        IDSAuth(address(this)).setAuthority(IDSAuthority(address(guard)));
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
      address currAuthority = address(IDSAuth(address(this)).authority());
      if (currAuthority == address(0)) {
        return;
      }
      IDSGuard guard = IDSGuard(currAuthority);
      guard.forbid(_contractAddr, address(this), ALLOWED_METHOD_HASH);
    }
  }
}
