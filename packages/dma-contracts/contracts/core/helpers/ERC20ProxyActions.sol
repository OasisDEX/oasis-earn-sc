// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ERC20ProxyActions
 * @dev A contract that provides helper functions for interacting with ERC20 tokens through a proxy.
 */
contract ERC20ProxyActions {
  /**
   * @dev Transfers a specified amount of tokens from the caller's address to the specified recipient.
   * @param _token The address of the ERC20 token.
   * @param _to The address of the recipient.
   * @param _value The amount of tokens to transfer.
   */
  function transfer(address _token, address _to, uint256 _value) external {
    IERC20(_token).transfer(_to, _value);
  }

  /**
   * @dev Approves a specified spender to spend a specified amount of tokens on behalf of the caller.
   * @param _token The address of the ERC20 token.
   * @param _spender The address of the spender.
   * @param _value The amount of tokens to approve.
   */
  function approve(address _token, address _spender, uint256 _value) external {
    IERC20(_token).approve(_spender, _value);
  }

  /**
   * @dev Transfers a specified amount of tokens from one address to another.
   * @param _token The address of the ERC20 token.
   * @param _from The address from which to transfer tokens.
   * @param _to The address to which to transfer tokens.
   * @param _value The amount of tokens to transfer.
   */
  function transferFrom(address _token, address _from, address _to, uint256 _value) external {
    IERC20(_token).transferFrom(_from, _to, _value);
  }
}
