import { getAaveProtocolData } from '@dma-library/protocols/aave'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AavePosition } from '@dma-library/types/aave'
import {
  SparkGetCurrentPositionArgs,
  SparkGetCurrentPositionDependencies,
} from '@dma-library/views/spark/types'
import BigNumber from 'bignumber.js'

export type SparkView = {
  getCurrentPosition: any
}

export type SparkGetCurrentPosition = (
  args: SparkGetCurrentPositionArgs,
  addresses: SparkGetCurrentPositionDependencies,
) => Promise<AavePosition>

export const getCurrentPosition: SparkGetCurrentPosition = async (args, dependencies) => {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = AaveCommon.getAaveTokenAddresses(
    {
      collateralToken: collateralToken,
      debtToken: debtToken,
    },
    dependencies.addresses,
  )

  const protocolData = await getAaveProtocolData({
    collateralTokenAddress,
    debtTokenAddress,
    addresses: dependencies.addresses,
    proxy: args.proxy,
    provider: dependencies.provider,
    protocolVersion: dependencies.protocolVersion,
  })

  const {
    reserveDataForCollateral,
    userReserveDataForCollateral,
    userReserveDataForDebtToken,
    aaveCollateralTokenPriceInEth,
    aaveDebtTokenPriceInEth,
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
    aaveCollateralTokenPriceInEth,
    aaveDebtTokenPriceInEth,
  )
  const oracle = validatedCollateralPrice.div(validatedDebtPrice)

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
