import { getNetwork } from '@deploy-configurations/utils/network/index'
import { TEN, ZERO } from '@dma-common/constants'
import { areAddressesEqual } from '@dma-common/utils/addresses'
import { operations } from '@dma-library/operations'
import { MorphoBlueAdjustRiskDownArgs } from '@dma-library/operations/morphoblue/multiply/adjust-risk-down'
import { MorphoBlueAdjustRiskUpArgs } from '@dma-library/operations/morphoblue/multiply/adjust-risk-up'
import {
  FlashloanProvider,
  IOperation,
  MorphoBluePosition,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { SummerStrategy } from '@dma-library/types/ajna/ajna-strategy'
import * as SwapUtils from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { isRiskIncreasing } from '@domain/utils'
import BigNumber from 'bignumber.js'

import {
  getSwapData,
  getTokenSymbol,
  MinimalPosition,
  MorphoMultiplyDependencies,
  prepareMorphoMultiplyDMAPayload,
  simulateAdjustment,
} from './open'

export interface MorphoAdjustMultiplyPayload {
  riskRatio: Domain.IRiskRatio
  collateralAmount: BigNumber
  slippage: BigNumber
  position: MorphoBluePosition
  quoteTokenPrecision: number
  collateralTokenPrecision: number
  user: string
  dpmProxyAddress: string
}

export type MorphoAdjustRiskStrategy = (
  args: MorphoAdjustMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
) => Promise<SummerStrategy<MorphoBluePosition>>

const positionType: PositionType = 'Multiply'

export const adjustMultiply: MorphoAdjustRiskStrategy = (
  args: MorphoAdjustMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
) => {
  if (isRiskIncreasing(args.riskRatio.loanToValue, args.position.riskRatio.loanToValue)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}

const adjustRiskUp: MorphoAdjustRiskStrategy = async (args, dependencies) => {
  const oraclePrice = args.position.marketPrice
  const collateralTokenSymbol = await getTokenSymbol(
    args.position.marketParams.collateralToken,
    dependencies.provider,
  )
  const debtTokenSymbol = await getTokenSymbol(
    args.position.marketParams.loanToken,
    dependencies.provider,
  )

  const mappedArgs = {
    ...args,
    collateralTokenSymbol,
    quoteTokenSymbol: debtTokenSymbol,
    collateralAmount: args.collateralAmount.shiftedBy(args.collateralTokenPrecision),
  }

  const mappedPosition: MinimalPosition = {
    collateralAmount: args.position.collateralAmount.shiftedBy(args.collateralTokenPrecision),
    debtAmount: args.position.debtAmount.shiftedBy(args.quoteTokenPrecision),
    riskRatio: args.position.riskRatio,
    marketParams: {
      loanToken: args.position.marketParams.loanToken,
      collateralToken: args.position.marketParams.collateralToken,
    },
  }

  // Simulate adjust
  const riskIsIncreasing = true
  const simulatedAdjustment = await simulateAdjustment(
    mappedArgs,
    dependencies,
    mappedPosition,
    riskIsIncreasing,
    oraclePrice,
    collateralTokenSymbol,
    debtTokenSymbol,
  )

  // Get swap data
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    mappedArgs,
    args.position,
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
    collateralTokenSymbol,
    debtTokenSymbol,
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
  return prepareMorphoMultiplyDMAPayload(
    args,
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
    args.position,
    collateralTokenSymbol,
    debtTokenSymbol,
  )
}

const adjustRiskDown: MorphoAdjustRiskStrategy = async (args, dependencies) => {
  const oraclePrice = args.position.marketPrice

  const collateralTokenSymbol = await getTokenSymbol(
    args.position.marketParams.collateralToken,
    dependencies.provider,
  )
  const debtTokenSymbol = await getTokenSymbol(
    args.position.marketParams.loanToken,
    dependencies.provider,
  )
  const mappedArgs = {
    ...args,
    collateralTokenSymbol,
    quoteTokenSymbol: debtTokenSymbol,
    collateralAmount: args.collateralAmount.shiftedBy(args.collateralTokenPrecision),
  }

  const mappedPosition: MinimalPosition = {
    collateralAmount: args.position.collateralAmount.shiftedBy(args.collateralTokenPrecision),
    debtAmount: args.position.debtAmount.shiftedBy(args.quoteTokenPrecision),
    riskRatio: args.position.riskRatio,
    marketParams: {
      loanToken: args.position.marketParams.loanToken,
      collateralToken: args.position.marketParams.collateralToken,
    },
  }

  // Simulate adjust
  const riskIsIncreasing = false
  const simulatedAdjustment = await simulateAdjustment(
    mappedArgs,
    dependencies,
    mappedPosition,
    riskIsIncreasing,
    oraclePrice,
    collateralTokenSymbol,
    debtTokenSymbol,
  )

  // Get swap data
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    mappedArgs,
    args.position,
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
    collateralTokenSymbol,
    debtTokenSymbol,
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
  return prepareMorphoMultiplyDMAPayload(
    args,
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
    args.position,
    collateralTokenSymbol,
    debtTokenSymbol,
  )
}

async function buildOperation(
  args: MorphoAdjustMultiplyPayload,
  dependencies: MorphoMultiplyDependencies,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  swapData: SwapData,
  riskIsIncreasing: boolean,
): Promise<IOperation> {
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
    fromTokenSymbol: riskIsIncreasing
      ? simulatedAdjust.position.debt.symbol
      : simulatedAdjust.position.collateral.symbol,
    toTokenSymbol: riskIsIncreasing
      ? simulatedAdjust.position.collateral.symbol
      : simulatedAdjust.position.debt.symbol,
  })

  const network = await getNetwork(dependencies.provider)

  const morphoBlueMarket = {
    loanToken: args.position.marketParams.loanToken,
    collateralToken: args.position.marketParams.collateralToken,
    oracle: args.position.marketParams.oracle,
    irm: args.position.marketParams.irm,
    lltv: args.position.marketParams.lltv.times(TEN.pow(18)),
  }

  const collateral = {
    address: args.position.marketParams.collateralToken,
    isEth: areAddressesEqual(
      args.position.marketParams.collateralToken,
      dependencies.addresses.WETH,
    ),
  }

  const debt = {
    address: args.position.marketParams.loanToken,
    isEth: areAddressesEqual(args.position.marketParams.loanToken, dependencies.addresses.WETH),
  }

  const swap = {
    fee: fee.toNumber(),
    data: swapData.exchangeCalldata,
    amount: swapAmountBeforeFees,
    collectFeeFrom,
    receiveAtLeast: swapData.minToTokenAmount,
  }

  const addresses = {
    morphoblue: dependencies.morphoAddress,
    operationExecutor: dependencies.operationExecutor,
    tokens: dependencies.addresses,
  }

  const proxy = {
    address: args.dpmProxyAddress,
    isDPMProxy: true,
    owner: args.user,
  }

  if (riskIsIncreasing) {
    const riskUpMultiplyArgs: MorphoBlueAdjustRiskUpArgs = {
      morphoBlueMarket,
      collateral,
      addresses,
      proxy,
      network,
      swap,
      debt: {
        ...debt,
        borrow: {
          amount: borrowAmount,
        },
      },
      deposit: {
        address: args.position.marketParams.collateralToken,
        amount: args.collateralAmount.times(TEN.pow(args.collateralTokenPrecision)).integerValue(),
      },
      flashloan: {
        token: {
          amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
          address: args.position.marketParams.loanToken,
        },
        amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
        provider: FlashloanProvider.Balancer,
      },
    }

    return await operations.morphoblue.multiply.adjustRiskUp(riskUpMultiplyArgs)
  }
  const riskDownMultiplyArgs: MorphoBlueAdjustRiskDownArgs = {
    morphoBlueMarket,
    debt,
    swap,
    addresses,
    proxy,
    network,
    collateral: {
      ...collateral,
      withdrawal: {
        amount: simulatedAdjust.delta.collateral.abs(),
      },
    },
    flashloan: {
      token: {
        amount: Domain.collateralToDebtSwapFlashloan(swapData.minToTokenAmount),
        address: args.position.marketParams.loanToken,
      },
      amount: Domain.collateralToDebtSwapFlashloan(swapData.minToTokenAmount),
      provider: FlashloanProvider.Balancer,
    },
  }

  return await operations.morphoblue.multiply.adjustRiskDown(riskDownMultiplyArgs)
}
