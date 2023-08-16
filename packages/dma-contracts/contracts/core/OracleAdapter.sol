// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { IOracleAdapter } from "../interfaces/common/IOracleAdapter.sol";
import { USD } from "../interfaces/common/IOracleAdapter.sol";
import { IAggregatorV3 } from "../interfaces/chainlink/IAggregatorV3.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * See { IOracleAdapter }
 */
contract OracleAdapter is IOracleAdapter, Ownable {
  /// STATE VARIABLES

  // token => baseToken => oracle; if baseToken is the zero-address it is considered to be denomitated in USD
  mapping(address => mapping(address => address)) public oracles;

  /// CONSTRUCTOR
  // solhint-disable-next-line no-empty-blocks
  constructor() Ownable() {}

  /// ADD ORACLES
  function addChainlinkOracleInUSD(address token, address oracle) external {
    oracles[token][USD] = oracle;
  }

  function addChainlinkOracle(address token, address baseToken, address oracle) external {
    oracles[token][baseToken] = oracle;
  }

  /// RETRIEVE ORACLES
  function getOracle(address token, address baseToken) external view returns (address) {
    return oracles[token][baseToken];
  }

  /// RETRIEVE PRICES
  function getLatestPrice(
    address token,
    address baseToken
  ) external view returns (int256 latestAnswer, uint8 decimals) {
    address oracle = oracles[token][baseToken];
    if (oracle != address(0x0)) {
      revert OracleNotFound(token, baseToken);
    }

    (, latestAnswer, , , ) = IAggregatorV3(oracle).latestRoundData();
    decimals = IAggregatorV3(oracle).decimals();
  }
}
