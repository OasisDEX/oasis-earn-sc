import { getNetwork } from '@deploy-configurations/utils/network/index'
import { ONE, ZERO } from '@dma-common/constants'
import { amountToWei } from '@dma-common/utils/common'
import { areSymbolsEqual } from '@dma-common/utils/symbols/index'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { operations } from '@dma-library/operations'
import { ajnaBuckets } from '@dma-library/strategies'
import {
  buildFromToken,
  buildToToken,
  getSwapData,
  prepareAjnaMultiplyDMAPayload,
} from '@dma-library/strategies/ajna/multiply/common'
import {
  AjnaOpenMultiplyPayload,
  FlashloanProvider,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { AjnaCommonDMADependencies, AjnaPosition, SummerStrategy } from '@dma-library/types/ajna'
import * as SwapUtils from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import * as Domain from '@domain'
import * as DomainUtils from '@domain/utils'
import BigNumber from 'bignumber.js'

export type AjnaOpenMultiplyStrategy = (
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<SummerStrategy<AjnaPosition>>

const positionType: PositionType = 'Multiply'

export const openMultiply: AjnaOpenMultiplyStrategy = async (args, dependencies) => {
  const position = await getPosition(args, dependencies)
  const riskIsIncreasing = verifyRiskDirection(args, position)
  const oraclePrice = args.collateralPrice.div(args.quotePrice)

  const mappedArgs = {
    ...args,
    collateralAmount: args.collateralAmount.shiftedBy(args.collateralTokenPrecision),
  }

  const simulatedAdjustment = await simulateAdjustment(
    mappedArgs,
    dependencies,
    position,
    riskIsIncreasing,
    oraclePrice,
  )
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    { ...mappedArgs, position },
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
  )
  const operation = await buildOperation(
    mappedArgs,
    dependencies,
    position,
    simulatedAdjustment,
    swapData,
    riskIsIncreasing,
  )

  return prepareAjnaMultiplyDMAPayload(
    { ...args, position },
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
  )
}

async function getPosition(args: AjnaOpenMultiplyPayload, dependencies: AjnaCommonDMADependencies) {
  const getPosition = views.ajna.getPosition
  const position = await getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
      collateralToken: args.collateralToken,
      quoteToken: args.quoteToken,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
      getCumulatives: dependencies.getCumulatives,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  return position
}

function verifyRiskDirection(args: AjnaOpenMultiplyPayload, position: AjnaPosition): true {
  const riskIsIncreasing = DomainUtils.isRiskIncreasing(
    args.riskRatio.loanToValue,
    position.riskRatio.loanToValue,
  )
  if (!riskIsIncreasing) {
    throw new Error('Risk must increase on openMultiply')
  }

  return riskIsIncreasing
}

async function simulateAdjustment(
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  riskIsIncreasing: true,
  oraclePrice: BigNumber,
) {
  const preFlightSwapAmount = amountToWei(ONE, args.quoteTokenPrecision)
  const fromToken = buildFromToken({ ...args, position }, riskIsIncreasing)
  const toToken = buildToToken({ ...args, position }, riskIsIncreasing)
  const fee = SwapUtils.feeResolver(fromToken.symbol, toToken.symbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: SwapUtils.isCorrelatedPosition(fromToken.symbol, toToken.symbol),
  })
  const { swapData: preFlightSwapData } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    string
  >({
    args: {
      fromToken,
      toToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: preFlightSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })
  const preFlightMarketPrice = DomainUtils.standardiseAmountTo18Decimals(
    preFlightSwapData.fromTokenAmount,
    args.quoteTokenPrecision,
  ).div(
    DomainUtils.standardiseAmountTo18Decimals(
      preFlightSwapData.toTokenAmount,
      args.collateralTokenPrecision,
    ),
  )

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: fromToken.symbol,
    toTokenSymbol: toToken.symbol,
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
      oracle: oraclePrice,
      // Get pre-flight market price from 1inch
      market: preFlightMarketPrice,
    },
    slippage: args.slippage,
    options: {
      collectSwapFeeFrom: collectFeeFrom,
    },
    network: dependencies.network,
  }

  // TODO: Refactor AjnaPosition to extend IPositionV2 (eventually)
  const mappedPosition = {
    debt: {
      amount: position.debtAmount,
      symbol: fromToken.symbol,
      precision: args.quoteTokenPrecision,
    },
    collateral: {
      amount: position.collateralAmount,
      symbol: toToken.symbol,
      precision: args.collateralTokenPrecision,
    },
    riskRatio: position.riskRatio,
  }

  return Domain.adjustToTargetRiskRatio(mappedPosition, args.riskRatio, positionAdjustArgs)
}

async function buildOperation(
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  swapData: SwapData,
  riskIsIncreasing: true,
) {
  /** Not relevant for Ajna */
  const debtTokensDeposited = ZERO
  const borrowAmount = simulatedAdjust.delta.debt.minus(debtTokensDeposited)
  const collateralTokenSymbol = simulatedAdjust.position.collateral.symbol.toUpperCase()
  const debtTokenSymbol = simulatedAdjust.position.debt.symbol.toUpperCase()
  const fee = SwapUtils.feeResolver(collateralTokenSymbol, debtTokenSymbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: SwapUtils.isCorrelatedPosition(collateralTokenSymbol, debtTokenSymbol),
  })
  const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: simulatedAdjust.position.debt.symbol,
    toTokenSymbol: simulatedAdjust.position.collateral.symbol,
  })

  const network = await getNetwork(dependencies.provider)

  const openMultiplyArgs = {
    debt: {
      address: position.pool.quoteToken,
      isEth: areSymbolsEqual(simulatedAdjust.position.debt.symbol, 'ETH'),
      borrow: {
        amount: borrowAmount,
      },
    },
    collateral: {
      address: position.pool.collateralToken,
      isEth: areSymbolsEqual(simulatedAdjust.position.collateral.symbol, 'ETH'),
    },
    deposit: {
      // Always collateral only as deposit on Ajna
      address: position.pool.collateralToken,
      amount: args.collateralAmount,
    },
    swap: {
      fee: fee.toNumber(),
      data: swapData.exchangeCalldata,
      amount: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      token: {
        amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
        address: position.pool.quoteToken,
      },
      amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
      // Always balancer on Ajna for now
      provider: FlashloanProvider.Balancer,
    },
    position: {
      type: positionType,
    },
    proxy: {
      address: args.dpmProxyAddress,
      // Ajna is always DPM
      isDPMProxy: true,
      owner: args.user,
    },
    addresses: {
      ...dependencies.addresses,
      WETH: dependencies.WETH,
      operationExecutor: dependencies.operationExecutor,
      pool: args.poolAddress,
    },
    price: new BigNumber(ajnaBuckets[ajnaBuckets.length - 1]),
    network,
  }
  return await operations.ajna.open(openMultiplyArgs)
}
