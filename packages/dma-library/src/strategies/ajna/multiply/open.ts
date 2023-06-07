import operationExecutorAbi from '@abis/system/contracts/core/OperationExecutor.sol/OperationExecutor.json'
import { ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { areAddressesEqual } from '@dma-common/utils/addresses/index'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { areSymbolsEqual } from '@dma-common/utils/symbols'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { operations } from '@dma-library/operations'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import {
  AjnaOpenMultiplyPayload,
  FlashloanProvider,
  IOperation,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { AjnaCommonDMADependencies, AjnaPosition, AjnaStrategy } from '@dma-library/types/ajna'
import * as SwapUtils from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import * as Domain from '@domain'
import * as DomainUtils from '@domain/utils'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AjnaOpenMultiplyStrategy = (
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<AjnaStrategy<AjnaPosition>>

const positionType: PositionType = 'Multiply'

export const openMultiply: AjnaOpenMultiplyStrategy = async (args, dependencies) => {
  const position = await getPosition(args, dependencies)
  const riskIsIncreasing = verifyRiskDirection(args, position)
  const oraclePrice = args.collateralPrice.div(args.quotePrice)
  const simulatedAdjustment = await simulateAdjustment(
    args,
    dependencies,
    position,
    riskIsIncreasing,
    oraclePrice,
  )
  const swapData = await getSwapData(
    args,
    dependencies,
    position,
    simulatedAdjustment,
    riskIsIncreasing,
  )
  const operation = await buildOperation(
    args,
    dependencies,
    position,
    simulatedAdjustment,
    swapData,
    riskIsIncreasing,
    oraclePrice,
  )
  const targetPosition = new AjnaPosition(
    position.pool,
    args.dpmProxyAddress,
    amountFromWei(
      simulatedAdjustment.position.collateral.amount,
      simulatedAdjustment.position.collateral.precision,
    ),
    amountFromWei(
      simulatedAdjustment.position.debt.amount,
      simulatedAdjustment.position.debt.precision,
    ),
    args.collateralPrice,
    args.quotePrice,
  )

  const isDepositingEth = areAddressesEqual(position.pool.collateralToken, dependencies.WETH)
  return prepareAjnaDMAPayload({
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors: [],
    warnings: [],
    success: [],
    notices: [],
    txValue: resolveAjnaEthAction(
      isDepositingEth,
      amountFromWei(args.collateralAmount, TYPICAL_PRECISION),
    ),
  })
}

async function getPosition(args: AjnaOpenMultiplyPayload, dependencies: AjnaCommonDMADependencies) {
  const getPosition = views.ajna.getPosition
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

function verifyRiskDirection(args: AjnaOpenMultiplyPayload, position: AjnaPosition): true {
  const riskIsIncreasing = DomainUtils.determineRiskDirection(
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
  const fromToken = buildFromToken(args, position)
  const toToken = buildToToken(args, position)
  const fee = SwapUtils.feeResolver(fromToken.symbol, toToken.symbol, {
    isIncreasingRisk: riskIsIncreasing,
    // Strategy is called open multiply (not open earn)
    isEarnPosition: positionType === 'Earn',
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

function buildFromToken(args: AjnaOpenMultiplyPayload, position: AjnaPosition) {
  return {
    symbol: args.quoteTokenSymbol.toUpperCase(),
    address: position.pool.quoteToken,
    args: args.quoteTokenPrecision,
  }
}

function buildToToken(args: AjnaOpenMultiplyPayload, position: AjnaPosition) {
  return {
    symbol: args.collateralTokenSymbol.toUpperCase(),
    address: position.pool.collateralToken,
    args: args.collateralTokenPrecision,
  }
}

async function getSwapData(
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  riskIsIncreasing: true,
) {
  const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
  const fee = SwapUtils.feeResolver(
    simulatedAdjust.position.collateral.symbol,
    simulatedAdjust.position.debt.symbol,
    {
      isIncreasingRisk: riskIsIncreasing,
      // Strategy is called open multiply (not open earn)
      isEarnPosition: positionType === 'Earn',
    },
  )
  const { swapData } = await SwapUtils.getSwapDataHelper<typeof dependencies.addresses, string>({
    args: {
      fromToken: buildFromToken(args, position),
      toToken: buildToToken(args, position),
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: swapAmountBeforeFees,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
    },
  })

  return swapData
}

async function buildOperation(
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
  position: AjnaPosition,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  swapData: SwapData,
  riskIsIncreasing: true,
  oraclePrice: BigNumber,
) {
  /** Not relevant for Ajna */
  const debtTokensDeposited = ZERO
  const borrowAmount = simulatedAdjust.delta.debt.minus(debtTokensDeposited)
  const fee = SwapUtils.feeResolver(
    simulatedAdjust.position.collateral.symbol,
    simulatedAdjust.position.debt.symbol,
    {
      isIncreasingRisk: riskIsIncreasing,
      // Strategy is called open multiply (not open earn)
      isEarnPosition: positionType === 'Earn',
    },
  )
  const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: simulatedAdjust.position.debt.symbol,
    toTokenSymbol: simulatedAdjust.position.collateral.symbol,
  })

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
    // Prices must be in 18 decimal precision
    price: amountToWei(oraclePrice, TYPICAL_PRECISION),
  }
  return await operations.ajna.open(openMultiplyArgs)
}

function encodeOperation(operation: IOperation, dependencies: AjnaCommonDMADependencies): string {
  const operationExecutor = new ethers.Contract(
    dependencies.operationExecutor,
    operationExecutorAbi,
    dependencies.provider,
  )
  return operationExecutor.interface.encodeFunctionData('executeOp', [
    operation.calls,
    operation.operationName,
  ])
}
