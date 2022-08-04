// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.5;


import { ILendingPoolAddressesProvider } from "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import { ILendingPoolDataProvider } from "../../interfaces/aave/ILendingPoolDataProvider.sol";

import "hardhat/console.sol";

contract AaveView {

     bytes32 public constant DATA_PROVIDER_ID =
        0x0100000000000000000000000000000000000000000000000000000000000000;

    struct TokenInfo {
        address aTokenAddress;
        address underlyingTokenAddress;
        uint256 collateralFactor;
        uint256 price;
    }

    function getTokenInfo(address market, address tokenAddress) public view returns(uint256) {

                console.log('VIEW 0' );

        ILendingPoolDataProvider dataProvider =  ILendingPoolDataProvider(
            ILendingPoolAddressesProvider(market).getAddress(DATA_PROVIDER_ID)
        );

        console.log('VIEW 1' );
        

        (,uint256 ltv,,,,,,,,) = dataProvider.getReserveConfigurationData(tokenAddress);


        console.log('LTV', ltv );
        

        return ltv;


        // (address aToken,,) = dataProvider.getReserveTokensAddresses(_tokenAddresses[i]);

        // tokens[i] = TokenInfo({
        //     aTokenAddress: aToken,
        //     underlyingTokenAddress: _tokenAddresses[i],
        //     collateralFactor: ltv,
        //     price: IPriceOracleGetterAave(priceOracleAddress).getAssetPrice(_tokenAddresses[i])
        // });
        
    }

}