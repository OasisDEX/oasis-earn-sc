import { getNetwork } from '@deploy-configurations/utils/network/index'
import { ONE, TEN, ZERO } from '@dma-common/constants'
import { Address, CollectFeeFrom } from '@dma-common/types'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { BALANCER_FEE } from '@dma-library/config/flashloan-fees'
import { operations } from '@dma-library/operations'
import { Network } from '@deploy-configurations/types/network'
import {
  FlashloanProvider,
  IOperation,
  MorphoBluePosition,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { AjnaError, AjnaNotice, AjnaStrategy, AjnaSuccess, AjnaWarning } from '@dma-library/types/ajna'
import * as SwapUtils from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import { GetMorphoCumulativesData } from '@dma-library/views/morpho'
import * as Domain from '@domain'
import * as DomainUtils from '@domain/utils'
import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'
import { CommonDMADependencies, GetSwapData } from '@dma-library/types/common'
import { MorphoBlueOpenOperationArgs } from '@dma-library/operations/morphoblue/multiply/open'
import { areAddressesEqual } from '@dma-common/utils/addresses'
import { calculateFee } from '@dma-common/utils/swap'
import { encodeOperation } from '@dma-library/utils/operation'
import { resolveTxValue } from '@dma-library/protocols/ajna'
import { TokenAddresses } from '@dma-library/operations/morphoblue/addresses'

interface MorphoOpenMultiplyPayload {
    collateralPriceUSD: BigNumber
    quotePriceUSD: BigNumber
    marketId: string
    dpmProxyAddress: string
    collateralTokenPrecision: number
    quoteTokenPrecision: number
    riskRatio: Domain.IRiskRatio
    collateralAmount: BigNumber
    slippage: BigNumber
    user: string
}

interface MorphoOpenMultiplyDependencies extends CommonDMADependencies {
    getCumulatives: GetMorphoCumulativesData,
    getSwapData: GetSwapData,
    morphoAddress: string, 
    network: Network
    addresses: TokenAddresses
}

export type MorphoOpenMultiplyStrategy = (
  args: MorphoOpenMultiplyPayload,
  dependencies: MorphoOpenMultiplyDependencies,
) => Promise<AjnaStrategy<MorphoBluePosition>>

const positionType: PositionType = 'Multiply'

export const openMultiply: MorphoOpenMultiplyStrategy = async (args, dependencies) => {
  const position = await getPosition(args, dependencies)
  const riskIsIncreasing = verifyRiskDirection(args, position)
  const oraclePrice = position.collateralPrice
  const collateralTokenSymbol = await getTokenSymbol(position.marketParams.collateralToken, dependencies.provider)
  const debtTokenSymbol = await getTokenSymbol(position.marketParams.loanToken, dependencies.provider)
  
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
    collateralTokenSymbol,
    debtTokenSymbol,
  )
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
    mappedArgs,
    position,
    dependencies,
    simulatedAdjustment,
    riskIsIncreasing,
    positionType,
    collateralTokenSymbol,
    debtTokenSymbol,
  )
  const operation = await buildOperation(
    args,
    dependencies,
    position,
    simulatedAdjustment,
    swapData,
    riskIsIncreasing,
  )

  return prepareMorphoMultiplyDMAPayload(
    args,
    dependencies,
    simulatedAdjustment,
    operation,
    swapData,
    collectFeeFrom,
    preSwapFee,
    riskIsIncreasing,
    position,
    collateralTokenSymbol,
    debtTokenSymbol,
  )
}

async function getPosition(args: MorphoOpenMultiplyPayload, dependencies: MorphoOpenMultiplyDependencies) {
  const getPosition = views.morpho.getPosition
  const position = await getPosition(
    {
      collateralPriceUSD: args.collateralPriceUSD,
      collateralPrecision: args.collateralTokenPrecision,
      quotePriceUSD: args.quotePriceUSD,
      quotePrecision: args.quoteTokenPrecision,
      proxyAddress: args.dpmProxyAddress,
      marketId: args.marketId,
    },
    dependencies,
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  return position
}

function verifyRiskDirection(args: MorphoOpenMultiplyPayload, position: MorphoBluePosition): true {
  const riskIsIncreasing = DomainUtils.isRiskIncreasing(
    args.riskRatio.loanToValue,
    position.riskRatio.loanToValue,
  )
  if (!riskIsIncreasing) {
    throw new Error('Risk must increase on openMultiply')
  }

  return riskIsIncreasing
}

export function buildFromToken(args: MorphoOpenMultiplyPayload, position: MorphoBluePosition, isIncreasingRisk: boolean, collateralTokenSymbol: string, debtTokenSymbol: string) {
    if (isIncreasingRisk) {
      return {
        symbol: debtTokenSymbol,
        address: position.marketParams.loanToken,
        precision: args.quoteTokenPrecision,
      }
    } else {
      return {
        symbol: collateralTokenSymbol,
        address: position.marketParams.collateralToken,
        precision: args.collateralTokenPrecision,
      }
    }
  }
  
  export function buildToToken(args: MorphoOpenMultiplyPayload, position: MorphoBluePosition, isIncreasingRisk: boolean, collateralTokenSymbol: string, debtTokenSymbol: string) {
    if (isIncreasingRisk) {
      return {
        symbol: collateralTokenSymbol,
        address: position.marketParams.collateralToken,
        precision: args.collateralTokenPrecision,
      }
    } else {
      return {
        symbol: debtTokenSymbol,
        address: position.marketParams.loanToken,
        precision: args.quoteTokenPrecision,
      }
    }
  }

async function simulateAdjustment(
  args: MorphoOpenMultiplyPayload,
  dependencies: MorphoOpenMultiplyDependencies,
  position: MorphoBluePosition,
  riskIsIncreasing: true,
  oraclePrice: BigNumber,
  collateralTokenSymbol: string,
  debtTokenSymbol: string,
) {
  const preFlightSwapAmount = amountToWei(ONE, args.quoteTokenPrecision)
  const fromToken = buildFromToken(args, position, riskIsIncreasing, collateralTokenSymbol, debtTokenSymbol)
  const toToken = buildToToken(args, position, riskIsIncreasing, collateralTokenSymbol, debtTokenSymbol)
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
  args: MorphoOpenMultiplyPayload,
  dependencies: MorphoOpenMultiplyDependencies,
  position: MorphoBluePosition,
  simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
  swapData: SwapData,
  riskIsIncreasing: true,
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
    fromTokenSymbol: simulatedAdjust.position.debt.symbol,
    toTokenSymbol: simulatedAdjust.position.collateral.symbol,
  })

  const network = await getNetwork(dependencies.provider)

  console.log(`
  simulation:
    colateralDelta ${simulatedAdjust.delta.collateral.div(TEN.pow(18)).toString()}
    debtDelta ${simulatedAdjust.delta.debt.div(TEN.pow(6)).toString()}
    simulated ltv ${simulatedAdjust.position.riskRatio.loanToValue.toString()}
    simulated ltv ${simulatedAdjust.position.riskRatio.multiple.toString()}

    args.collateralAmount ${args.collateralAmount.toString()}
    position coll ${simulatedAdjust.position.collateral.amount.div(TEN.pow(18)).toString()}
  `)

  console.log(`

    ${args.collateralAmount.times(TEN.pow(args.collateralTokenPrecision))}

    ${simulatedAdjust.swap.minToTokenAmount}
    ${simulatedAdjust.delta.collateral}
    args.collateralAmount.plus(simulatedAdjust.delta.collateral)
    ${args.collateralAmount.plus(simulatedAdjust.delta.collateral)}

    ${position.market.totalBorrowAssets}
    ${position.market.totalBorrowShares}
    ${position.market.totalSupplyShares}
    ${position.market.totalSupplyAssets}
    ${position.market.fee}
  
  `)

  const openMultiplyArgs: MorphoBlueOpenOperationArgs = {
    morphoBlueMarket: {
      loanToken: position.marketParams.loanToken,
      collateralToken: position.marketParams.collateralToken,
      oracle: position.marketParams.oracle,
      irm: position.marketParams.irm,
      lltv: position.marketParams.lltv.times(TEN.pow(18)),
    },
    collateral: {
      address: position.marketParams.collateralToken,
      isEth: areAddressesEqual(position.marketParams.collateralToken, dependencies.addresses.WETH),
    },
    debt: {
      address: position.marketParams.loanToken,
      isEth: areAddressesEqual(position.marketParams.loanToken, dependencies.addresses.WETH),
      borrow: {
        amount: borrowAmount,
      },
    },
    deposit: {
      address: position.marketParams.collateralToken,
      amount: args.collateralAmount.times(TEN.pow(args.collateralTokenPrecision)),
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
        address: position.marketParams.loanToken,
      },
      amount: Domain.debtToCollateralSwapFlashloan(swapAmountBeforeFees),
      provider: FlashloanProvider.Balancer,
    },
    position: {
      type: positionType,
    },
    addresses: {
      morphoblue: dependencies.morphoAddress,
      operationExecutor: dependencies.operationExecutor,
      tokens: dependencies.addresses,
    },
    proxy: {
      address: args.dpmProxyAddress,
      isDPMProxy: true,
      owner: args.user,
    },
    network,
  }
  return await operations.morphoblue.multiply.open(openMultiplyArgs)
}

export async function getSwapData(
    args: MorphoOpenMultiplyPayload,
    position: MorphoBluePosition,
    dependencies: MorphoOpenMultiplyDependencies,
    simulatedAdjust: Domain.ISimulationV2 & Domain.WithSwap,
    riskIsIncreasing: boolean,
    positionType: PositionType,
    collateralTokenSymbol: string,
    debtTokenSymbol: string,
    __feeOverride?: BigNumber,
  ) {
    const swapAmountBeforeFees = simulatedAdjust.swap.fromTokenAmount
    const fee =
      __feeOverride ||
      SwapUtils.feeResolver(
        simulatedAdjust.position.collateral.symbol,
        simulatedAdjust.position.debt.symbol,
        {
          isIncreasingRisk: riskIsIncreasing,
          // Strategy is called open multiply (not open earn)
          isEarnPosition: positionType === 'Earn',
        },
      )
    const { swapData, collectFeeFrom, preSwapFee } = await SwapUtils.getSwapDataHelper<
      typeof dependencies.addresses,
      string
    >({
      args: {
        fromToken: buildFromToken(args, position, riskIsIncreasing, collateralTokenSymbol, debtTokenSymbol),
        toToken: buildToToken(args, position, riskIsIncreasing, collateralTokenSymbol, debtTokenSymbol),
        slippage: args.slippage,
        fee,
        swapAmountBeforeFees: swapAmountBeforeFees,
      },
      addresses: dependencies.addresses,
      services: {
        getSwapData: dependencies.getSwapData,
      },
    })
  
    return { swapData, collectFeeFrom, preSwapFee }
  }

async function getTokenSymbol(token: Address, provider: providers.Provider): Promise<string> {
  const erc20 = new ethers.Contract(token, [{
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
        {
            "name": "",
            "type": "string"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
},], provider)

const symbol = await erc20.symbol()

console.log(symbol, token)

  return symbol
}

function prepareMorphoMultiplyDMAPayload(
  args: MorphoOpenMultiplyPayload,
  dependencies: MorphoOpenMultiplyDependencies,
  simulatedAdjustment: Domain.ISimulationV2 & Domain.WithSwap,
  operation: IOperation,
  swapData: SwapData,
  collectFeeFrom: CollectFeeFrom,
  preSwapFee: BigNumber,
  riskIsIncreasing: boolean,
  position: MorphoBluePosition,
  collateralTokenSymbol: string,
  debtTokenSymbol: string,
) {
  const collateralAmount = amountFromWei(
    simulatedAdjustment.position.collateral.amount,
    simulatedAdjustment.position.collateral.precision,
  )
  const debtAmount = amountFromWei(
    simulatedAdjustment.position.debt.amount,
    simulatedAdjustment.position.debt.precision,
  )

  const targetPosition = new MorphoBluePosition(
    position.owner,
    collateralAmount,
    debtAmount,
    position.collateralPrice,
    position.debtPrice,
    position.marketParams,
    position.market,
    position.price,
    position.rate,
    position.pnl,
  )

  const isDepositingEth = areAddressesEqual(position.marketParams.collateralToken, dependencies.addresses.WETH)
  const txAmount = args.collateralAmount
  const fromTokenSymbol = riskIsIncreasing ? debtTokenSymbol : collateralTokenSymbol
  const toTokenSymbol = riskIsIncreasing ? collateralTokenSymbol : debtTokenSymbol
  const fee = SwapUtils.feeResolver(fromTokenSymbol, toTokenSymbol, {
    isIncreasingRisk: riskIsIncreasing,
    isEarnPosition: false,
  })
  const postSwapFee =
    collectFeeFrom === 'sourceToken' ? ZERO : calculateFee(swapData.toTokenAmount, fee.toNumber())
  const tokenFee = preSwapFee.plus(postSwapFee)

  // Validation
  const borrowAmount = simulatedAdjustment.delta.debt
    .shiftedBy(-args.quoteTokenPrecision)

  const errors = [
    // Add as required...
    // ...validateDustLimitMultiply(targetPosition),
    // ...validateLiquidity(targetPosition, args.position, borrowAmount),
    // ...validateBorrowUndercollateralized(targetPosition, args.position, borrowAmount),
  ]

  const warnings = [
    // ...validateGenerateCloseToMaxLtv(targetPosition, args.position),
    // ...validateLiquidationPriceCloseToMarketPrice(targetPosition),
  ]

  return prepareDMAPayload({
    swaps: [{ ...swapData, collectFeeFrom, tokenFee }],
    dependencies,
    targetPosition,
    data: encodeOperation(operation, dependencies),
    errors,
    warnings,
    successes: [],
    notices: [],
    txValue: resolveTxValue(isDepositingEth, txAmount),
  })
}

const prepareDMAPayload = ({
  dependencies,
  targetPosition,
  errors,
  warnings,
  data,
  txValue,
  swaps,
}: {
  dependencies: CommonDMADependencies
  targetPosition: MorphoBluePosition
  errors: AjnaError[]
  warnings: AjnaWarning[]
  notices: AjnaNotice[]
  successes: AjnaSuccess[]
  data: string
  txValue: string
  swaps: (SwapData & { collectFeeFrom: 'sourceToken' | 'targetToken'; tokenFee: BigNumber })[]
}): AjnaStrategy<MorphoBluePosition> => {
  return {
    simulation: {
      swaps: swaps.map(swap => ({
        fromTokenAddress: swap.fromTokenAddress,
        toTokenAddress: swap.toTokenAddress,
        fromTokenAmount: swap.fromTokenAmount,
        toTokenAmount: swap.toTokenAmount,
        minToTokenAmount: swap.minToTokenAmount,
        exchangeCalldata: swap.exchangeCalldata,
        collectFeeFrom: swap.collectFeeFrom,
        fee: swap.tokenFee,
      })),
      errors,
      warnings,
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data,
      value: txValue,
    },
  }
}