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

  /**
   * @notice Constructs the MorphoBlueReallocateTo contract
   * @param _registry The address of the ServiceRegistry contract
   */
  constructor(address _registry) {
    require(_registry != address(0), "MorphoBlueReallocateTo: registry cannot be the zero address");
    registry = ServiceRegistry(_registry);
    address _bundler = registry.getRegisteredService("MorphoBlueBundler");
    require(_bundler != address(0), "MorphoBlueBundler: bundler cannot be the zero address");
    BUNDLER = _bundler;
  }

  /**
   * @notice Executes the reallocation of liquidity
   * @dev Look at UseStore.sol to get additional info on paramsMapping.
   * @param data Encoded calldata that conforms to the ReallocateToData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ReallocateToData memory reallocateToData = parseInputs(data);

    _validateReallocateToData(reallocateToData);
    
    IBundler(BUNDLER).multicall(reallocateToData.data);
  }

  /**
   * @notice Parses the input calldata to extract ReallocateToData
   * @param _callData The encoded calldata
   * @return params The decoded ReallocateToData struct
   */
  function parseInputs(
    bytes memory _callData
  ) public pure returns (ReallocateToData memory params) {
    return abi.decode(_callData, (ReallocateToData));
  }

  /**
   * @notice Validates the ReallocateToData struct
   * @param _reallocateToData The ReallocateToData struct to validate
   */
  function _validateReallocateToData(ReallocateToData memory _reallocateToData) internal pure {
    for (uint256 i = 0; i < _reallocateToData.data.length; i++) {
      bytes4 selector;
      bytes memory _data = _reallocateToData.data[i];
      assembly {
        selector := mload(add(_data, 32))
      }
      require(selector == REALLOCATE_TO_SELECTOR, "MorphoBlueReallocateTo: invalid selector");
    }
  }
}
