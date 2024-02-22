import { ZERO } from '@dma-common/constants'
import { getAaveProtocolData } from '@dma-library/protocols/aave'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveLikePosition, AaveLikePositionV2 } from '@dma-library/types/aave-like'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '@dma-library/views/aave/types'
import {
  calculateViewValuesForPosition,
  ensureOraclePricesDefined,
} from '@dma-library/views/aave-like'
import BigNumber from 'bignumber.js'

export {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
}

// TODO update ts
export type OmniCommonArgs = {
  primaryTokenReserveData: any
  secondaryTokenReserveData: any
  aggregatedData: any
  collateralPrice: BigNumber
  debtPrice: BigNumber
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

  const pnl = {
    cumulatives: args.aggregatedData?.positionCumulatives
      ? {
          ...defaultLendingCumulatives,
          borrowCumulativeDepositInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeDepositInCollateralToken,
          borrowCumulativeWithdrawInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawInCollateralToken,
          borrowCumulativeDepositInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeDepositInQuoteToken,
          borrowCumulativeWithdrawInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawInQuoteToken,
          borrowCumulativeFeesInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeFeesInCollateralToken,
          borrowCumulativeFeesInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeFeesInQuoteToken,
          borrowCumulativeFeesUSD: args.aggregatedData.positionCumulatives.cumulativeFeesUSD,
          borrowCumulativeDepositUSD: args.aggregatedData.positionCumulatives.cumulativeDepositUSD,
          borrowCumulativeWithdrawUSD:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawUSD,
        }
      : defaultLendingCumulatives,
    withFees: ZERO,
    withoutFees: ZERO,
  }

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

// TODO move it somewhere
export const defaultLendingCumulatives = {
  borrowCumulativeDepositUSD: ZERO,
  borrowCumulativeDepositInQuoteToken: ZERO,
  borrowCumulativeDepositInCollateralToken: ZERO,
  borrowCumulativeWithdrawUSD: ZERO,
  borrowCumulativeWithdrawInQuoteToken: ZERO,
  borrowCumulativeWithdrawInCollateralToken: ZERO,
  borrowCumulativeCollateralDeposit: ZERO,
  borrowCumulativeCollateralWithdraw: ZERO,
  borrowCumulativeDebtDeposit: ZERO,
  borrowCumulativeDebtWithdraw: ZERO,
  borrowCumulativeFeesUSD: ZERO,
  borrowCumulativeFeesInQuoteToken: ZERO,
  borrowCumulativeFeesInCollateralToken: ZERO,
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

  const pnl = {
    cumulatives: args.aggregatedData?.positionCumulatives
      ? {
          ...defaultLendingCumulatives,
          borrowCumulativeDepositInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeDepositInCollateralToken,
          borrowCumulativeWithdrawInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawInCollateralToken,
          borrowCumulativeDepositInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeDepositInQuoteToken,
          borrowCumulativeWithdrawInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawInQuoteToken,
          borrowCumulativeFeesInCollateralToken:
            args.aggregatedData.positionCumulatives.cumulativeFeesInCollateralToken,
          borrowCumulativeFeesInQuoteToken:
            args.aggregatedData.positionCumulatives.cumulativeFeesInQuoteToken,
          borrowCumulativeFeesUSD: args.aggregatedData.positionCumulatives.cumulativeFeesUSD,
          borrowCumulativeDepositUSD: args.aggregatedData.positionCumulatives.cumulativeDepositUSD,
          borrowCumulativeWithdrawUSD:
            args.aggregatedData.positionCumulatives.cumulativeWithdrawUSD,
        }
      : defaultLendingCumulatives,
    withFees: ZERO,
    withoutFees: ZERO,
  }

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
  )
}
