pragma solidity ^0.8.15;

/**
 * @title OracleAdapter
 * @notice Contract in charge of holding the list of Oracles used for price feeds. The adapter has
 *         two main purposes:
 *
 *            - Serve as storage for the list of Oracles, without polluting the Service Registry
 *            - Provide a single entry point for all Oracle-related price fetching, regardless of
 *              the Oracle type
 */
contract IOracleAdapter {
  /// CONSTANTS

  // The zero-address is used to denote USD-denominated Oracles
  address internal constant USD = address(0x0);

  /// ADD ORACLES
  function addChainlinkOracleInUSD(address token, address oracle) external;

  function addChainlinkOracle(address token, address baseToken, address oracle) external;

  /// RETRIEVE ORACLES
  function getOracle(address token, address baseToken) external view returns (address);

  /// RETRIEVE PRICES
  function getLatestPrice(
    address token,
    address baseToken
  ) external view returns (int256 price, uint256 decimals);

  /// ERRORS
  error OracleNotFound(address token, address baseToken);
}
