import { getAaveProtocolData } from '@dma-library/protocols/aave'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AavePosition } from '@dma-library/types/aave'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '@dma-library/views/aave/types'
import { ensureOraclePricesDefined } from '@dma-library/views/aave-like'
import BigNumber from 'bignumber.js'

export {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
}
export type AaveView = {
  v2: (
    args: AaveGetCurrentPositionArgs,
    dependencies: Omit<AaveV2GetCurrentPositionDependencies, 'protocolVersion'>,
  ) => Promise<AavePosition>
  v3: (
    args: AaveGetCurrentPositionArgs,
    dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocolVersion'>,
  ) => Promise<AavePosition>
}

export type AaveV2GetCurrentPosition = (
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV2GetCurrentPositionDependencies,
) => Promise<AavePosition>

export const getCurrentPositionAaveV2: AaveV2GetCurrentPosition = async (args, dependencies) => {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = AaveCommon.getAaveTokenAddresses(
    {
      collateralToken: collateralToken,
      debtToken: debtToken,
    },
    dependencies.addresses,
  )

  if (!dependencies.addresses.tokens.DAI) {
    throw new Error('Missing DAI address')
  }

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
  } = protocolData

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  const maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

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

export type AaveV3GetCurrentPosition = (
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV3GetCurrentPositionDependencies,
) => Promise<AavePosition>

export const getCurrentPositionAaveV3: AaveV3GetCurrentPosition = async (args, dependencies) => {
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
