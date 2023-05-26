import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import { adjustToTargetRiskRatio } from '@domain/adjust-position'
import { IRiskRatio } from '@domain/risk-ratio'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface OpenMultiplyArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
  slippage: BigNumber
  riskRatio: IRiskRatio
}

export interface Dependencies {
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  operationExecutor: Address
  WETH: Address
  getPoolData: GetPoolData
  getPosition?: typeof views.ajna.getPosition
}

export type AjnaOpenMultiplyStrategy = (
  args: OpenMultiplyArgs,
  dependencies: Dependencies,
) => Promise<Strategy<AjnaPosition>>

// Steps
// - Get position [ DONE ]
// - Check if position exists [ DONE ]
// - Get oraclePrice from Chainlink // Think protocol directory
// - Calculate target position [ DONE ]
// - Pull in SwapDataHelper
// - Map target position to AjnaPosition
// - Encode data for payload
// - We don't need flags for this one so let's ignore them
// - We can use swaps? If we agree on a type for Swap

export const openMultiply: AjnaOpenMultiplyStrategy = async (args, dependencies) => {
  const getPosition = dependencies.getPosition ? dependencies.getPosition : views.ajna.getPosition
  const position = await getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const positionAdjustArgs = {
    toDeposit: {
      collateral: args.collateralAmount,
      /** Not relevant for Ajna */
      debt: ZERO,
    },
    fees: {
      oazo: ZERO, // Resolve fees
      flashLoan: ZERO, // Resolve FL fees
    },
    prices: {
      oracle: ZERO,
      market: ZERO, // Get quote market price from 1inch use previous step deposit delta for next market price
    },
    slippage: args.slippage,
    options: {
      collectSwapFeeFrom: 'sourceToken' as const, // Actually determine this
    },
  }

  // TODO: Refactor AjnaPosition to extend IPositionV2 (eventually)
  const mappedPosition = {
    debt: {
      amount: position.debtAmount,
      symbol: position.pool.quoteToken,
      precision: args.quoteTokenPrecision,
    },
    collateral: {
      amount: position.collateralAmount,
      symbol: position.pool.collateralToken,
      precision: args.collateralTokenPrecision,
    },
    riskRatio: position.riskRatio,
  }

  const simulatedAdjustment = adjustToTargetRiskRatio(
    mappedPosition,
    args.riskRatio,
    positionAdjustArgs,
  )

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const positionAfterDeposit = position.deposit(args.collateralAmount)

  const quoteAmount = (
    args.riskRatio.loanToValue.isZero()
      ? positionAfterDeposit.minRiskRatio.loanToValue.decimalPlaces(2, BigNumber.ROUND_UP)
      : args.riskRatio.loanToValue
  ).times(args.collateralAmount.times(args.collateralPrice))

  const targetPosition = positionAfterDeposit.borrow(quoteAmount)

  return prepareAjnaDMAPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
