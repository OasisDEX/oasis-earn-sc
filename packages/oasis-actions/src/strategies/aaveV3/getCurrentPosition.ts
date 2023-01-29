import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aaveOracleABI from '../../abi/aaveOracle.json'
import ProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'

import { amountFromWei } from '../../helpers'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IViewPositionDependencies, IViewPositionParams } from '../types'
import { AavePosition, AAVETokens } from '../types/aave'

export async function getCurrentPosition(
  { collateralToken, debtToken, proxy }: IViewPositionParams<AAVETokens>,
  { addresses, provider }: IViewPositionDependencies<AAVEStrategyAddresses>,
): Promise<AavePosition> {
  const tokenAddresses = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    STETH: addresses.STETH,
    USDC: addresses.USDC,
    WBTC: addresses.WBTC,
  }

  console.log('GET CURR POS Addresses', addresses );
  
  const collateralTokenAddress = tokenAddresses[collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

    console.log('COLL TOKEN', collateralTokenAddress);

    console.log('DEBT TOKEN', debtTokenAddress );
    
    
  const protocolDataProvider = new ethers.Contract(
    addresses.aaveProtocolDataProvider,
    ProtocolDataProviderABI,
    provider,
  )

  const aaveOracle = new ethers.Contract(
    addresses.aavePriceOracle,
    aaveOracleABI,
    provider,
  )


  console.log('BEFORE PRICES', );
  
  const [
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    userReserveDataForDebtToken,
    userReserveDataForCollateral,
    reserveDataForCollateral,
  ] = await Promise.all([
    aaveOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aaveOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      protocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
      protocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
      protocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
  ])

  console.log('AFTER PRICES', );
  

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  const maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  return new AavePosition(
    {
      amount: new BigNumber(userReserveDataForDebtToken.currentVariableDebt.toString()),
      symbol: debtToken.symbol,
      precision: debtToken.precision,
      address: debtTokenAddress,
    },
    {
      amount: new BigNumber(userReserveDataForCollateral.currentATokenBalance.toString()),
      symbol: collateralToken.symbol,
      precision: collateralToken.precision,
      address: collateralTokenAddress,
    },
    oracle,
    {
      dustLimit: new BigNumber(0),
      maxLoanToValue: maxLoanToValue,
      liquidationThreshold: liquidationThreshold,
    },
  )
}
