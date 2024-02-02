import { getNetwork } from '@deploy-configurations/utils/network/index'
import { ZERO } from '@dma-common/constants'
import { areSymbolsEqual } from '@dma-common/utils/symbols'
import { operations } from '@dma-library/operations'
import { ajnaBuckets } from '@dma-library/strategies'
import {
  getSwapData,
  prepareAjnaMultiplyDMAPayload,
  simulateAdjustment,
} from '@dma-library/strategies/ajna/multiply/common'
import {
  AjnaMultiplyPayload,
  AjnaPosition,
  FlashloanProvider,
  PositionType,
  SummerStrategy,
  SwapData,
} from '@dma-library/types'
import { AjnaCommonDMADependencies } from '@dma-library/types/ajna'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { isRiskIncreasing } from '@domain/utils'
import BigNumber from 'bignumber.js'

export type AjnaAdjustRiskStrategy = (
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<SummerStrategy<AjnaPosition>>

const positionType: PositionType = 'Multiply'

export const adjustMultiply: AjnaAdjustRiskStrategy = (
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => {
  if (isRiskIncreasing(args.riskRatio.loanToValue, args.position.riskRatio.loanToValue)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}

const adjustRiskUp: AjnaAdjustRiskStrategy = async (args, dependencies) => {
  const oraclePrice = args.collateralPrice.div(args.quotePrice)

  // Simulate adjust
  const riskIsIncreasing = true
  const simulatedAdjustment = await simulateAdjustment(
    args,
    dependencies,
    riskIsIncreasing,
    oraclePrice,
    positionType,
  )

  // Get swap data
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    args,
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
  )

  // Build operation
  const operation = await buildOperation(
    args,
    dependencies,
    simulatedAdjustment,
    swapData,
    riskIsIncreasing,
  )

  // Prepare payload
  return prepareAjnaMultiplyDMAPayload(
    args,
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
  )
}

const adjustRiskDown: AjnaAdjustRiskStrategy = async (args, dependencies) => {
  const oraclePrice = args.collateralPrice.div(args.quotePrice)

  // Simulate adjust
  const riskIsIncreasing = false
  const simulatedAdjustment = await simulateAdjustment(
    args,
    dependencies,
    riskIsIncreasing,
    oraclePrice,
    positionType,
  )

  // Get swap data
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    args,
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
  )

  // Build operation
  const operation = await buildOperation(
    args,
    dependencies,
    simulatedAdjustment,
    swapData,
    riskIsIncreasing,
  )

  // Prepare payload
  return prepareAjnaMultiplyDMAPayload(
    args,
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
  )
}

async function buildOperation(
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  swapData: SwapData,
  riskIsIncreasing: boolean,
) {
  /** Not relevant for Ajna */
  const debtTokensDeposited = ZERO
  const borrowAmount = simulatedAdjust.delta.debt.minus(debtTokensDeposited)
  const withdrawCollateralAmount = simulatedAdjust.delta.collateral.abs()

  const fromTokenSymbol = riskIsIncreasing ? args.quoteTokenSymbol : args.collateralTokenSymbol
  const toTokenSymbol = riskIsIncreasing ? args.collateralTokenSymbol : args.quoteTokenSymbol

  const fee = SwapUtils.feeResolver(fromTokenSymbol, toTokenSymbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: SwapUtils.isCorrelatedPosition(fromTokenSymbol, toTokenSymbol),
  })
  // When adjusting risk up we need to flashloan the swap amount before deducting fees
  // Assuming an ETH/USDC position, we'd be Flashloaning USDC to swap for ETH
  // Once the received ETH is deposited as collateral we can then increase our debt
  // And use the additional debt (USDC in this example) to repay the flashloan with fees included
  const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount

  // When adjusting down we need to flashloan the minimum amount of USDC received from the swap
  // Assuming an ETH/USDC position, this would be the minimum amount of USDC we'd receive from swapping ETH after withdrawing ETH
  // We Flashloan the minimum amount to pay down debt before using the proceeds from the ETH -> USDC swap to repay the flashloan
  const minSwapToAmount = swapData.minToTokenAmount

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol,
    toTokenSymbol,
  })

  const flashloanAmount = riskIsIncreasing
    ? Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees)
    : Domain.collateralToDebtSwapFlashloan(minSwapToAmount)

  const network = await getNetwork(dependencies.provider)

  const commonAdjustMultiplyArgs = {
    debt: {
      address: args.position.pool.quoteToken,
      isEth: areSymbolsEqual(simulatedAdjust.position.debt.symbol, 'ETH'),
    },
    collateral: {
      address: args.position.pool.collateralToken,
      isEth: areSymbolsEqual(simulatedAdjust.position.collateral.symbol, 'ETH'),
    },
    deposit: {
      // Always collateral only as deposit on Ajna
      address: args.position.pool.collateralToken,
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
        amount: flashloanAmount,
        address: args.position.pool.quoteToken,
      },
      amount: flashloanAmount,
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
  if (riskIsIncreasing) {
    const adjustUpMultiplyArgs = {
      ...commonAdjustMultiplyArgs,
      debt: {
        ...commonAdjustMultiplyArgs.debt,
        borrow: {
          amount: borrowAmount,
        },
      },
    }
    return await operations.ajna.adjustRiskUp(adjustUpMultiplyArgs)
  } else {
    const adjustDownMultiplyArgs = {
      ...commonAdjustMultiplyArgs,
      collateral: {
        ...commonAdjustMultiplyArgs.collateral,
        withdrawal: {
          amount: withdrawCollateralAmount,
        },
      },
    }
    return await operations.ajna.adjustRiskDown(adjustDownMultiplyArgs)
  }
}
