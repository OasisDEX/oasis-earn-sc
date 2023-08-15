pragma solidity ^0.8.15;

import { IOracleAdapter } from "../interfaces/IOracleAdapter.sol";
import { IAggregatorV3 } from "../interfaceschainlink/IAggregatorV3.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @see IOracleAdapter
 */
contract OracleAdapter is IOracleAdapter, Ownable {
    /// CONSTANTS
    
    // The zero-address is used to denote USD-denominated Oracles
    address constant USD = address(0x0);

    /// STATE VARIABLES

    // token => baseToken => oracle; if baseToken is the zero-address it is considered to be denomitated in USD
    public mapping(address, mapping(address, address)) oracles;

    /// CONSTRUCTOR
    constructor(address owner) Ownable(owner) {}

    /// ADD ORACLES
    function addChainlinkOracleInUSD(address token, address oracle) external {
        oraclesInToken[token][USD] = oracle;
    }

    function addChainlinkOracle(address token, address baseToken, address oracle) external {
        oraclesInToken[token][baseToken] = oracle;
    }

    /// RETRIEVE ORACLES
    function getOracle(address token, address baseToken) external view returns (address) {
        return oraclesInToken[token][baseToken];
    }

    /// RETRIEVE PRICES
    function getLatestPrice(address token, address baseToken) external view returns (int256 latestAnswer, uint8 decimals) {
        address oracle = oraclesInToken[token][baseToken];
        if(oracle != address(0x0)) {
            revert OracleNotFound(token, baseToken);
        }

        (, latestAnswer,,,) = IAggregatorV3(oracle).latestRoundData();
        decimals = IAggregatorV3(oracle).decimals();
    }


}
