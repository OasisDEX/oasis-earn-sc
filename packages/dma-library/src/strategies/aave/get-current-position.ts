import BigNumber from 'bignumber.js'

import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3'
import { getAaveProtocolData } from '../../protocols/aave/get-aave-protocol-data'
import { IViewPositionDependencies, IViewPositionParams } from '../../types'
import { AavePosition, AAVETokens } from '../../types/aave'
import { getAaveTokenAddresses } from './get-aave-token-addresses'

export enum AaveVersion {
  v2 = 'v2',
  v3 = 'v3',
}

export type AaveGetCurrentPositionArgs = IViewPositionParams<AAVETokens>
export type AaveV2GetCurrentPositionDependencies =
  IViewPositionDependencies<AAVEStrategyAddresses> & {
    protocolVersion: AaveVersion.v2
  }
export type AaveV3GetCurrentPositionDependencies =
  IViewPositionDependencies<AAVEV3StrategyAddresses> & { protocolVersion: AaveVersion.v3 }

export type AaveGetCurrentPositionDependencies =
  | AaveV2GetCurrentPositionDependencies
  | AaveV3GetCurrentPositionDependencies

export async function getCurrentPosition(
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveGetCurrentPositionDependencies,
): Promise<AavePosition> {
  if (isV2(dependencies)) {
    return getCurrentPositionAaveV2(args, dependencies)
  } else if (isV3(dependencies)) {
    return getCurrentPositionAaveV3(args, dependencies)
  } else {
    throw new Error('Invalid Aave version')
  }
}

async function getCurrentPositionAaveV2(
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV2GetCurrentPositionDependencies,
): Promise<AavePosition> {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
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
  } = protocolData

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

async function getCurrentPositionAaveV3(
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV3GetCurrentPositionDependencies,
): Promise<AavePosition> {
  const debtToken = args.debtToken
  const collateralToken = args.collateralToken
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
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

function isV2(
  dependencies: AaveGetCurrentPositionDependencies,
): dependencies is IViewPositionDependencies<AAVEStrategyAddresses> & {
  protocolVersion: AaveVersion.v2
} {
  return dependencies.protocolVersion === AaveVersion.v2
}

function isV3(
  dependencies: AaveGetCurrentPositionDependencies,
): dependencies is IViewPositionDependencies<AAVEV3StrategyAddresses> & {
  protocolVersion: AaveVersion.v3
} {
  return dependencies.protocolVersion === AaveVersion.v3
}
