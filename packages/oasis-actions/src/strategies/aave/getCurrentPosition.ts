import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei } from '../../helpers'
import { IPosition, Position } from '../../helpers/calculations/Position'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IViewPositionDependencies, IViewPositionParams } from '../types/IPositionRepository'

export async function getCurrentPosition(
  { collateralToken, debtToken, proxy }: IViewPositionParams<AAVETokens>,
  { addresses, provider }: IViewPositionDependencies<AAVEStrategyAddresses>,
): Promise<IPosition> {
  const tokenAddresses = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    STETH: addresses.stETH,
    USDC: addresses.USDC,
    WBTC: addresses.wBTC,
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
    reserveDataForDebtToken,
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
    aaveProtocolDataProvider.getReserveConfigurationData(debtTokenAddress),
    aaveProtocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
  ])

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  const maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  return new Position(
    {
      amount: new BigNumber(userReserveDataForDebtToken.currentVariableDebt.toString()),
      symbol: debtToken.symbol,
      precision: debtToken.precision,
    },
    {
      amount: new BigNumber(userReserveDataForCollateral.currentATokenBalance.toString()),
      symbol: collateralToken.symbol,
      precision: collateralToken.precision,
    },
    oracle,
    {
      dustLimit: new BigNumber(0),
      maxLoanToValue: maxLoanToValue,
      liquidationThreshold: liquidationThreshold,
    },
  )
}
