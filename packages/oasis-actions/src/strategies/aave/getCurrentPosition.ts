import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei } from '../../helpers'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IViewPositionDependencies, IViewPositionParams } from '../../types'
import { AavePosition, AAVETokens } from '../../types/aave'

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

  const collateralTokenAddress = tokenAddresses[collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  const aaveProtocolDataProvider = new ethers.Contract(
    addresses.aaveProtocolDataProvider,
    aaveProtocolDataProviderABI,
    provider,
  )

  const aavePriceOracle = new ethers.Contract(
    addresses.aavePriceOracle,
    aavePriceOracleABI,
    provider,
  )

  const [
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    userReserveDataForDebtToken,
    userReserveDataForCollateral,
    reserveDataForCollateral,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getUserReserveData(debtTokenAddress, proxy),
    aaveProtocolDataProvider.getUserReserveData(collateralTokenAddress, proxy),
    aaveProtocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
  ])

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
