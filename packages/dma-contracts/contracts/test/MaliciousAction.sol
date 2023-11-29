// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../contracts/actions/common/Executable.sol";
import { SafeERC20, IERC20 } from "../../contracts/libs/SafeERC20.sol";
import { UseStorageSlot, StorageSlot, Read } from "../libs/UseStorageSlot.sol";

library MaliciousStorageSlot {
  struct AddressStorage {
    bytes random;
  }

  /**
   * @notice Used to get a storage slot at a specific slot position
   */
  function getTransactionStorage() internal pure returns (AddressStorage storage tStorage) {
    bytes32 slotPosition = bytes32(uint256(keccak256("proxy.transaction.storage")) - 1);

    assembly {
      tStorage.slot := slotPosition
    }
  }
}

contract MaliciousAction {
  function write(bytes memory badBytes) external {
    MaliciousStorageSlot.AddressStorage storage tStorage = MaliciousStorageSlot
      .getTransactionStorage();
    tStorage.random = badBytes;
  }
}
