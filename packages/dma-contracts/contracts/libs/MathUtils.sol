// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.5;

import { IJoin } from "../interfaces/maker/IJoin.sol";
import { SafeMath } from "../libs/SafeMath.sol";

library MathUtils {
  using SafeMath for uint256;

  uint256 public constant RAY = 10 ** 27;

  function uintToInt(uint256 x) internal pure returns (int256 y) {
    y = int256(x);
    require(y >= 0, "int-overflow");
  }

  function convertTo18(IJoin gemJoin, uint256 amt) internal view returns (uint256 wad) {
    // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
    // Adapters will automatically handle the difference of precision
    wad = amt.mul(10 ** (18 - gemJoin.dec()));
  }
}
