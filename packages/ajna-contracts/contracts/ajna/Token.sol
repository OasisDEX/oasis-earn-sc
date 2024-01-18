// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Token is ERC20, ERC20Burnable {
  uint8 public dec;

  constructor(
    string memory name,
    string memory ticker,
    address tokenReceiver_,
    uint8 _dec
  ) ERC20(name, ticker) {
    _mint(tokenReceiver_, 2_000_000_000 * 10 ** decimals());
    dec = _dec;
  }

  /*****************/
  /*** Overrides ***/
  /*****************/
  function decimals() public view virtual override returns (uint8) {
    return dec;
  }

  function _afterTokenTransfer(
    address from_,
    address to_,
    uint256 amount_
  ) internal override(ERC20) {
    super._afterTokenTransfer(from_, to_, amount_);
  }

  /**
   *  @notice Ensure tokens cannot be transferred to token contract
   */
  function _beforeTokenTransfer(address, address to_, uint256) internal view override {
    require(to_ != address(this), "Cannot transfer tokens to the contract itself");
  }

  function mint(address to_, uint256 amount_) external {
    _mint(to_, amount_);
  }

  function _burn(address account_, uint256 amount_) internal override(ERC20) {
    super._burn(account_, amount_);
  }

  function _mint(address to_, uint256 amount_) internal override(ERC20) {
    super._mint(to_, amount_);
  }
}
