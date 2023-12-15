// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.15;

import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { OperationExecutor } from "../core/OperationExecutor.sol";
import { MathUtils } from "../libs/MathUtils.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { Call } from "../core/types/Common.sol";
import { Address } from "../libs/Address.sol";

import "hardhat/console.sol";
contract OpExecTester {
  using Address for address;

  function execute(address opExecutorAddress, bytes calldata executionData, bytes32 expectedOpName) public {    
    bytes memory result = opExecutorAddress.functionCallWithValue(
      executionData,
      0,
      "OpExecTester: low-level call failed"
    );

    bytes32 opName = bytes32(result);
    require(opName == expectedOpName, "OpExecTester: opName mismatch");
  }
}
