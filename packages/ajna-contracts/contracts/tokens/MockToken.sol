// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 immutable DECIMALS;

    constructor(string memory _name, string memory _ticker, uint8 _decimals) ERC20(_name, _ticker) {
        DECIMALS = _decimals;
    }

    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
}
