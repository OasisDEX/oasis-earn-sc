import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { amountToWei } from '@dma-common/utils/common'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { getAaveTokenAddress } from '@dma-library/strategies'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import * as SwapUtils from '@dma-library/utils/swap'
import { feeResolver } from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import * as Domain from '@domain/adjust-position'
import { IRiskRatio } from '@domain/risk-ratio'
import * as DomainUtils from '@domain/utils'
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
  const position = await getPosition(args, dependencies)
  const simulatedAdjustment = await simulateAdjustment(args, dependencies, position)

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

async function getPosition(args: OpenMultiplyArgs, dependencies: Dependencies) {
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

  return position
}

async function simulateAdjustment(
  args: OpenMultiplyArgs,
  dependencies: Dependencies,
  position: AjnaPosition,
) {
  const riskIsIncreasing = DomainUtils.determineRiskDirection(
    args.riskRatio.loanToValue,
    position.riskRatio.loanToValue,
  )
  if (!riskIsIncreasing) {
    throw new Error('Risk must increase on openMultiply')
  }

  const quoteSwapAmount = amountToWei(new BigNumber(1), args.quoteTokenPrecision)
  const fee = feeResolver(position.pool.collateralToken, position.pool.quoteToken, {
    isIncreasingRisk: riskIsIncreasing,
    // Strategy is called open multiply (not open earn)
    isEarnPosition: false,
  })
  const { swapData: quoteSwapData } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    string
  >({
    args: {
      fromToken: { symbol: position.pool.quoteToken, precision: args.quoteTokenPrecision },
      toToken: { symbol: position.pool.collateralToken, precision: args.collateralTokenPrecision },
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: quoteSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })
  const positionAdjustArgs = {
    toDeposit: {
      collateral: args.collateralAmount,
      /** Not relevant for Ajna */
      debt: ZERO,
    },
    fees: {
      oazo: fee,
      flashLoan: BALANCER_FEE,
    },
    prices: {
      // Use Chainlink seed value for oracle
      oracle: ZERO,
      // Get quote market price from 1inch
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

  return Domain.adjustToTargetRiskRatio(mappedPosition, args.riskRatio, positionAdjustArgs)
}
