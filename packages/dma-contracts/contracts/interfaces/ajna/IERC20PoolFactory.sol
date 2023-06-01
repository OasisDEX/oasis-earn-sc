// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

/**
 *  @title ERC20 Pool Factory
 *  @dev   Used to deploy `ERC20` pools.
 */
interface IERC20PoolFactory {
  /**************************/
  /*** External Functions ***/
  /**************************/

  /**
   *  @notice Deploys a cloned pool for the given collateral and quote token.
   *  @dev    Pool must not already exist, and must use `WETH` instead of `ETH`.
   *  @param  collateral_   Address of `ERC20` collateral token.
   *  @param  quote_        Address of `ERC20` quote token.
   *  @param  interestRate_ Initial interest rate of the pool.
   *  @return pool_         Address of the newly created pool.
   */
  function deployPool(
    address collateral_,
    address quote_,
    uint256 interestRate_
  ) external returns (address pool_);

  /**
   * @notice Returns the address of a deployed pool based on its collateral and quote tokens.
   * @dev The deployedPools function provides an overview of all the pools that have been deployed and returns
   * the address of a particular pool using the unique combination of its collateral and quote tokens.
   * @param collateral_ The address of the ERC20 collateral token of the pool.
   * @param quote_ The address of the ERC20 quote token of the pool.
   * @return An address representing the deployed pool for the given collateral and quote tokens,
   * or the 0x0 address address if no such pool exists.
   */
  function deployedPools(
    bytes32 nonSubsetHash,
    address collateral_,
    address quote_
  ) external view returns (address);
}
