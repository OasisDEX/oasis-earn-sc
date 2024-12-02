// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ReallocateToData } from "../../core/types/MorphoBlue.sol";
import { IMorpho, MarketParams } from "../../interfaces/morpho-blue/IMorpho.sol";
import { MarketParamsLib } from "../../libs/morpho-blue/MarketParamsLib.sol";
import { MorphoLib } from "../../libs/morpho-blue/MorphoLib.sol";
import { SharesMathLib } from "../../libs/morpho-blue/SharesMathLib.sol";
import { IBundler } from "../../interfaces/morpho-blue/IBundler.sol";

/**
 * @title ReallocateTo | MorphoBlue Action contract
 * @notice Reallocates liquidity to a specified market
 */
contract MorphoBlueReallocateTo is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;
  using MarketParamsLib for MarketParams;
  using MorphoLib for IMorpho;
  using SharesMathLib for uint256;
  bytes4 public constant REALLOCATE_TO_SELECTOR = bytes4(hex"ef653419");
  address public immutable BUNDLER;

  constructor(address _registry) UseStore(_registry) {
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
