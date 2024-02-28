import { getAaveProtocolData } from '@dma-library/protocols/aave'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveLikePosition, AaveLikePositionV2 } from '@dma-library/types/aave-like'
import {
  AaveGetCurrentPositionArgs,
  AaveLikeCumulativeData,
  AaveLikeReserveConfigurationData,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
  ReserveData,
  ReserveDataReply,
} from '@dma-library/views/aave/types'
import {
  calculateViewValuesForPosition,
  ensureOraclePricesDefined,
  mapAaveLikeCumulatives,
} from '@dma-library/views/aave-like'
import BigNumber from 'bignumber.js'

export {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
}

export type OmniCommonArgs = {
  primaryTokenReserveData: ReserveDataReply
  secondaryTokenReserveData: ReserveDataReply
  reserveConfigurationData: AaveLikeReserveConfigurationData
  cumulatives?: AaveLikeCumulativeData
  collateralPrice: BigNumber
  debtPrice: BigNumber
  reserveData: ReserveData
}

export type AaveView = {
  v2: (
    args: AaveGetCurrentPositionArgs,
    dependencies: Omit<AaveV2GetCurrentPositionDependencies, 'protocolVersion'>,
  ) => Promise<AaveLikePosition>
  v3: (
    args: AaveGetCurrentPositionArgs,
    dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocolVersion'>,
  ) => Promise<AaveLikePosition>
  omni: {
    v2: (
      args: AaveGetCurrentPositionArgs & OmniCommonArgs,
      dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocolVersion'>,
    ) => Promise<AaveLikePositionV2>
    v3: (
      args: AaveGetCurrentPositionArgs & OmniCommonArgs,
      dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocolVersion'>,
    ) => Promise<AaveLikePositionV2>
  }
}

export type AaveV2GetCurrentPosition = (
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV2GetCurrentPositionDependencies,
) => Promise<AaveLikePosition>

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
    collateralTokenPriceInEth,
    debtTokenPriceInEth,
  } = protocolData

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(
    reserveDataForCollateral.liquidationThreshold.toString(),
  ).div(BASE)
  const maxLoanToValue = new BigNumber(reserveDataForCollateral.ltv.toString()).div(BASE)

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

export type AaveV2GetCurrentPositionOmni = (
  args: AaveGetCurrentPositionArgs & OmniCommonArgs,
  dependencies: AaveV2GetCurrentPositionDependencies,
) => Promise<AaveLikePositionV2>

export const getCurrentPositionAaveV2Omni: AaveV2GetCurrentPositionOmni = async (
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

export type AaveV3GetCurrentPosition = (
  args: AaveGetCurrentPositionArgs,
  dependencies: AaveV3GetCurrentPositionDependencies,
) => Promise<AaveLikePosition>

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

export type AaveV3GetCurrentPositionOmni = (
  args: AaveGetCurrentPositionArgs & OmniCommonArgs,
  dependencies: AaveV3GetCurrentPositionDependencies,
) => Promise<AaveLikePositionV2>

export const getCurrentPositionAaveV3Omni: AaveV3GetCurrentPositionOmni = async (
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
