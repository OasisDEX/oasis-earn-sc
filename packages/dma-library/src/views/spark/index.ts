import { getSparkProtocolData } from '@dma-library/protocols/spark'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveLikePosition, AaveLikePositionV2 } from '@dma-library/types/aave-like'
import { OmniCommonArgs } from '@dma-library/views/aave'
import {
  calculateViewValuesForPosition,
  ensureOraclePricesDefined,
  mapAaveLikeCumulatives,
} from '@dma-library/views/aave-like'
import {
  SparkGetCurrentPositionArgs,
  SparkGetCurrentPositionDependencies,
} from '@dma-library/views/spark/types'
import BigNumber from 'bignumber.js'

export type SparkView = SparkGetCurrentPosition
export type SparkViewOmni = SparkGetCurrentPositionOmni

export type SparkGetCurrentPosition = (
  args: SparkGetCurrentPositionArgs,
  addresses: SparkGetCurrentPositionDependencies,
) => Promise<AaveLikePosition>

export const getCurrentSparkPosition: SparkGetCurrentPosition = async (args, dependencies) => {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = AaveCommon.getAaveTokenAddresses(
    {
      collateralToken: collateralToken,
      debtToken: debtToken,
    },
    dependencies.addresses,
  )

  const protocolData = await getSparkProtocolData({
    collateralTokenAddress,
    debtTokenAddress,
    addresses: dependencies.addresses,
    proxy: args.proxy,
    provider: dependencies.provider,
  })

  const {
    reserveDataForCollateral,
    userReserveDataForCollateral,
    userReserveDataForDebtToken,
    collateralTokenPriceInEth,
    debtTokenPriceInEth,
    eModeCategoryData,
  } = protocolData

  const BASE = new BigNumber(10000)
  let liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  let maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

  if (eModeCategoryData !== undefined) {
    liquidationThreshold = new BigNumber(eModeCategoryData.liquidationThreshold.toString()).div(
      BASE,
    )
    maxLoanToValue = new BigNumber(eModeCategoryData.ltv.toString()).div(BASE)
  }

  const [validatedCollateralPrice, validatedDebtPrice] = ensureOraclePricesDefined(
    collateralTokenPriceInEth,
    debtTokenPriceInEth,
  )
  const oracle = validatedCollateralPrice.div(validatedDebtPrice)

  return new AaveLikePosition(
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

export type SparkGetCurrentPositionOmni = (
  args: SparkGetCurrentPositionArgs & OmniCommonArgs,
  addresses: SparkGetCurrentPositionDependencies,
) => Promise<AaveLikePositionV2>

export const getCurrentSparkPositionOmni: SparkGetCurrentPositionOmni = async (
  args,
  dependencies,
) => {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = AaveCommon.getAaveTokenAddresses(
    {
      collateralToken: collateralToken,
      debtToken: debtToken,
    },
    dependencies.addresses,
  )

  const protocolData = await getSparkProtocolData({
    collateralTokenAddress,
    debtTokenAddress,
    addresses: dependencies.addresses,
    proxy: args.proxy,
    provider: dependencies.provider,
  })

  const {
    reserveDataForCollateral,
    userReserveDataForCollateral,
    userReserveDataForDebtToken,
    collateralTokenPriceInEth,
    debtTokenPriceInEth,
    eModeCategoryData,
  } = protocolData

  const BASE = new BigNumber(10000)
  let liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  let maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

  if (eModeCategoryData !== undefined) {
    liquidationThreshold = new BigNumber(eModeCategoryData.liquidationThreshold.toString()).div(
      BASE,
    )
    maxLoanToValue = new BigNumber(eModeCategoryData.ltv.toString()).div(BASE)
  }

  const [validatedCollateralPrice, validatedDebtPrice] = ensureOraclePricesDefined(
    collateralTokenPriceInEth,
    debtTokenPriceInEth,
  )
  const oracle = validatedCollateralPrice.div(validatedDebtPrice)

  const category = {
    dustLimit: new BigNumber(0),
    maxLoanToValue: maxLoanToValue,
    liquidationThreshold: liquidationThreshold,
  }

  const { collateral, debt } = calculateViewValuesForPosition({
    collateralAmount: new BigNumber(userReserveDataForCollateral.currentATokenBalance.toString()),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    collateralPrecision: collateralToken.precision!,
    debtAmount: new BigNumber(userReserveDataForDebtToken.currentVariableDebt.toString()),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    debtPrecision: debtToken.precision!,
    collateralTokenPrice: args.collateralPrice,
    debtTokenPrice: args.debtPrice,
    collateralLiquidityRate: args.primaryTokenReserveData.liquidityRate,
    debtVariableBorrowRate: args.secondaryTokenReserveData.variableBorrowRate,
    category,
  })

  const pnl = mapAaveLikeCumulatives(args.cumulatives)

  return new AaveLikePositionV2(
    args.proxy,
    collateral,
    debt,
    args.collateralPrice,
    args.debtPrice,
    oracle,
    pnl,
    category,
    oracle,
    args.secondaryTokenReserveData.variableBorrowRate,
    args.primaryTokenReserveData.liquidityRate,
    args.reserveConfigurationData.liquidationBonus,
    args.reserveData,
  )
}
