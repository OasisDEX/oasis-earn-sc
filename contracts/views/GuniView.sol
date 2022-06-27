// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;

import "../libs/DS/DSMath.sol";

import "../interfaces/maker/IManager.sol";
import "../interfaces/maker/ISpotter.sol";
import "../interfaces/maker/IVat.sol";

import "../interfaces/guni/IGUNIRouter.sol";
import "../interfaces/guni/IGUNIResolver.sol";
import "../interfaces/guni/IGUNIToken.sol";
import "../interfaces/guni/IUniPool.sol";

/// @title Getter contract for Vault info from Maker protocol
contract GuniView is DSMath {

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  function getOtherTokenAmount(
    IGUNIToken guni,
    IGUNIResolver resolver,
    uint256 bal0,
    uint256 otherTokenDecimals
  ) public view returns (uint256 amount) {
    (uint256 sqrtPriceX96, , , , , , ) = IUniPool(guni.pool()).slot0();

    uint256 otherTokenTo18Conv = 10**(18 - otherTokenDecimals);

    (, amount) = resolver.getRebalanceParams(
      address(guni),
      guni.token0() == DAI ? bal0 : 0,
      guni.token1() == DAI ? bal0 : 0,
      ((((sqrtPriceX96 * sqrtPriceX96) >> 96) * 1e18) >> 96) * otherTokenTo18Conv
    );
  }
}
