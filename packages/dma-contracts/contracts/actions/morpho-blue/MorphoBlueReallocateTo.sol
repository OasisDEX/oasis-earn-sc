// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { ReallocateToData } from "../../core/types/MorphoBlue.sol";
import { IBundler } from "../../interfaces/morpho-blue/IBundler.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";

/**
 * @title ReallocateTo | MorphoBlue Action contract
 * @notice Reallocates liquidity to a specified market
 */
contract MorphoBlueReallocateTo is Executable {
  bytes4 public constant REALLOCATE_TO_SELECTOR = bytes4(hex"ef653419");
  address public immutable BUNDLER;
  ServiceRegistry public immutable registry;

  constructor(address _registry) {
    require(_registry != address(0), "MorphoBlueReallocateTo: registry cannot be the zero address");
    registry = ServiceRegistry(_registry);
    address _bundler = registry.getRegisteredService("MorphoBlueBundler");
    require(_bundler != address(0), "MorphoBlueBundler: bundler cannot be the zero address");
    BUNDLER = _bundler;
  }

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping.
   *
   * @param data Encoded calldata that conforms to the ReallocateToData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ReallocateToData memory reallocateToData = parseInputs(data);

    for (uint256 i = 0; i < reallocateToData.data.length; i++) {
      bytes4 selector;
      bytes memory _data = reallocateToData.data[i];
      assembly {
        selector := mload(add(_data, 32))
      }
      require(selector == REALLOCATE_TO_SELECTOR, "MorphoBluePublicAllocator: invalid selector");
    }

    IBundler(BUNDLER).multicall(reallocateToData.data);
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (ReallocateToData memory params) {
    return abi.decode(_callData, (ReallocateToData));
  }
}
