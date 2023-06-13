import { Address } from '@deploy-configurations/types/address'
import { getForkedNetwork } from '@deploy-configurations/utils/network'
import {
  FEE_ESTIMATE_INFLATOR,
  ONE,
  TYPICAL_PRECISION,
  UNUSED_FLASHLOAN_AMOUNT,
  ZERO,
} from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { operations } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import {
  getAaveTokenAddress,
  getAaveTokenAddresses,
} from '@dma-library/strategies/aave/get-aave-token-addresses'
import { AaveVersion } from '@dma-library/strategies/aave/get-current-position'
import {
  IOperation,
  IPositionTransitionArgs,
  PositionTransition,
  PositionType,
  SwapData,
} from '@dma-library/types'
import { AAVETokens } from '@dma-library/types/aave'
import { WithV2Addresses, WithV3Addresses } from '@dma-library/types/aave/addresses'
import { WithFee } from '@dma-library/types/aave/fee'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { FlashloanProvider } from '@dma-library/types/common'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { isRiskIncreasing } from '@dma-library/utils/swap'
import { acceptedFeeToken } from '@dma-library/utils/swap/accepted-fee-token'
import { feeResolver } from '@dma-library/utils/swap/fee-resolver'
import { getSwapDataHelper } from '@dma-library/utils/swap/get-swap-data'
import { IBaseSimulatedTransition, IPosition } from '@domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

export type AaveAdjustArgs = IPositionTransitionArgs<AAVETokens> & { positionType: PositionType }
type AaveAdjustSharedDependencies = {
  provider: providers.Provider
  currentPosition: IPosition
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: Address
  user: Address
  isDPMProxy: boolean
  debug?: boolean
}
export type AaveV2AdjustDependencies = AaveAdjustSharedDependencies &
  WithV2Addresses &
  WithV2Protocol
export type AaveV3AdjustDependencies = AaveAdjustSharedDependencies &
  WithV3Addresses &
  WithV3Protocol
export type AaveAdjustDependencies = AaveV2AdjustDependencies | AaveV3AdjustDependencies

export async function adjust(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  if (isRiskIncreasing(dependencies.currentPosition.riskRatio, args.multiple)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}

async function adjustRiskUp(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const isAdjustUp = true
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  // Get quote swap
  const estimatedSwapAmount$ = amountToWei(new BigNumber(1), args.debtToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees$: estimatedSwapAmount$,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // SimulateAdjustUp
  const { simulatedPositionTransition: simulatedAdjustUp } = await simulatePositionTransition(
    isAdjustUp,
    quoteSwapData,
    { ...args, fee },
    dependencies,
    true,
    dependencies.debug,
  )

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees$: simulatedAdjustUp.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // buildOperation
  const operation = await buildOperation({
    adjustRiskUp: isAdjustUp,
    swapData,
    simulatedPositionTransition: simulatedAdjustUp,
    collectFeeFrom,
    args,
    dependencies,
  })

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  // generateTransition
  return await generateTransition({
    isIncreasingRisk: isAdjustUp,
    swapData,
    operation,
    collectFeeFrom,
    fee,
    simulatedPositionTransition: simulatedAdjustUp,
    args,
    dependencies,
  })
}

async function adjustRiskDown(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const isAdjustDown = true
  const isAdjustUp = !isAdjustDown
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.collateralToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees$: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // SimulateAdjustDown
  const { simulatedPositionTransition: simulatedAdjustDown } = await simulatePositionTransition(
    isAdjustUp,
    quoteSwapData,
    { ...args, fee },
    dependencies,
    false,
  )

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees$: simulatedAdjustDown.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // buildOperation
  const operation = await buildOperation({
    adjustRiskUp: isAdjustUp,
    swapData,
    simulatedPositionTransition: simulatedAdjustDown,
    collectFeeFrom,
    args,
    dependencies,
  })

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  // generateTransition
  return await generateTransition({
    isIncreasingRisk: isAdjustUp,
    swapData,
    operation,
    collectFeeFrom,
    fee,
    simulatedPositionTransition: simulatedAdjustDown,
    args,
    dependencies,
  })
}

async function simulatePositionTransition(
  isRiskIncreasing: boolean,
  quoteSwapData: SwapData,
  args: AaveAdjustArgs & WithFee,
  dependencies: AaveAdjustDependencies,
  fromTokenIsDebt: boolean,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const currentPosition = await getCurrentPosition(args, dependencies)
  const protocolData = await getProtocolData(
    collateralTokenAddress,
    debtTokenAddress,
    args,
    dependencies,
  )

  if (!currentPosition || !protocolData) {
    throw new Error('Could not get current position or protocol data')
  }

  const {
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
  } = protocolData

  const BASE = new BigNumber(10000)
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(BASE)

  const multiple = args.multiple

  const depositDebtAmountInBaseUnits = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInBaseUnits = args.depositedByUser?.collateralInWei || ZERO

  const fromToken = fromTokenIsDebt ? args.debtToken : args.collateralToken
  const toToken = fromTokenIsDebt ? args.collateralToken : args.debtToken
  // Needs to be correct precision. First convert to base 18. Then divide
  const fromTokenPrecision = fromToken.precision
  const toTokenPrecision = toToken.precision

  const normalisedFromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, fromTokenPrecision),
    TYPICAL_PRECISION,
  )
  const normalisedToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, toTokenPrecision),
    TYPICAL_PRECISION,
  )

  const quoteMarketPriceWhenAdjustingUp = normalisedFromTokenAmount.div(normalisedToTokenAmount)
  const quoteMarketPriceWhenAdjustingDown = normalisedToTokenAmount.div(normalisedFromTokenAmount)
  const quoteMarketPrice = isRiskIncreasing
    ? quoteMarketPriceWhenAdjustingUp
    : quoteMarketPriceWhenAdjustingDown

  const flashloanFee = new BigNumber(0)

  const ethPerDAI = aaveFlashloanDaiPriceInEth
  const ethPerDebtToken = aaveDebtTokenPriceInEth
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = acceptedFeeToken({
    fromToken: fromToken.symbol,
    toToken: toToken.symbol,
  })

  return {
    simulatedPositionTransition: currentPosition.adjustToTargetRiskRatio(multiple, {
      fees: {
        flashLoan: flashloanFee,
        oazo: args.fee,
      },
      prices: {
        market: quoteMarketPrice,
        oracle: oracle,
        oracleFLtoDebtToken: oracleFLtoDebtToken,
      },
      slippage: args.slippage,
      flashloan: {
        maxLoanToValueFL: maxLoanToValueForFL,
        tokenSymbol: 'DAI',
      },
      depositedByUser: {
        debtAmount$: depositDebtAmountInBaseUnits,
        collateralAmount$: depositCollateralAmountInBaseUnits,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    }),
  }
}

function getCurrentPosition(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPosition | undefined> {
  if (isV2(dependencies)) {
    return dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: AaveVersion.v2,
      },
    )
  }
  if (isV3(dependencies)) {
    return dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: dependencies.protocol.version,
      },
    )
  }

  throw new Error('No position found')
}

async function getProtocolData(
  collateralTokenAddress: string,
  debtTokenAddress: string,
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): AaveProtocolData {
  if (isV2(dependencies)) {
    return dependencies.protocol.getProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }
  if (isV3(dependencies)) {
    return await dependencies.protocol.getProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }

  throw new Error('No protocol data could be found')
}

export function isV2(
  dependencies: AaveAdjustDependencies,
): dependencies is AaveV2AdjustDependencies & {
  protocolVersion: AaveVersion.v2
} {
  return dependencies.protocol.version === AaveVersion.v2
}

export function isV3(
  dependencies: AaveAdjustDependencies,
): dependencies is AaveV3AdjustDependencies & {
  protocolVersion: AaveVersion.v3
} {
  return dependencies.protocol.version === AaveVersion.v3
}

type BuildOperationArgs = {
  adjustRiskUp: boolean
  swapData: SwapData
  simulatedPositionTransition: IBaseSimulatedTransition
  collectFeeFrom: 'sourceToken' | 'targetToken'
  reserveEModeCategory?: number | undefined
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
}
type BuildOperationV2Args = BuildOperationArgs & {
  addresses: AAVEStrategyAddresses
}
type BuildOperationV3Args = BuildOperationArgs & {
  addresses: AAVEV3StrategyAddresses
}

async function buildOperation({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
}: BuildOperationArgs): Promise<IOperation | undefined> {
  if (isV2(dependencies)) {
    return buildOperationV2({
      adjustRiskUp,
      swapData,
      simulatedPositionTransition,
      collectFeeFrom,
      args,
      dependencies,
      addresses: dependencies.addresses,
    })
  }

  if (isV3(dependencies)) {
    return buildOperationV3({
      adjustRiskUp,
      swapData,
      simulatedPositionTransition,
      collectFeeFrom,
      args,
      dependencies,
      addresses: dependencies.addresses,
    })
  }

  throw new Error('No operation could be built')
}

async function buildOperationV2({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
  addresses,
}: BuildOperationV2Args) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const adjustRiskDown = !adjustRiskUp
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: adjustRiskUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
  const adjustRiskArgs = {
    collateral: {
      address: collateralTokenAddress,
      amount: depositCollateralAmountInWei,
      isEth: args.collateralToken.symbol === 'ETH',
    },
    debt: {
      address: debtTokenAddress,
      amount: depositDebtAmountInWei,
      isEth: args.debtToken.symbol === 'ETH',
    },
    deposit: {
      address: depositAddress,
      amount: depositAmount || ZERO,
    },
    swap: {
      fee: fee.toNumber(),
      data: swapData.exchangeCalldata,
      amount: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses,
  }

  if (adjustRiskUp) {
    const borrowAmount = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)
    const flAmt = simulatedPositionTransition.delta.flashloanAmount
    const flashloanAmount = flAmt.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flAmt

    const adjustRiskUpArgs = {
      ...adjustRiskArgs,
      debt: {
        ...adjustRiskArgs.debt,
        borrow: {
          amount: borrowAmount,
        },
      },
      flashloan: {
        amount: flashloanAmount,
        // Aave V2 not on L2
        provider: FlashloanProvider.DssFlash,
      },
    }
    return await operations.aave.v2.adjustRiskUp(adjustRiskUpArgs)
  }

  if (adjustRiskDown) {
    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const flAmtAbs = (simulatedPositionTransition.delta?.flashloanAmount || ZERO).abs()
    const flashloanAmount = flAmtAbs.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flAmtAbs
    const withdrawCollateralAmount = simulatedPositionTransition.delta.collateral.abs()
    const adjustRiskDownArgs = {
      ...adjustRiskArgs,
      collateral: {
        ...adjustRiskArgs.collateral,
        withdrawal: {
          amount: withdrawCollateralAmount,
        },
      },
      flashloan: {
        amount: flashloanAmount,
        // Aave V2 not on L2
        provider: FlashloanProvider.DssFlash,
      },
    }
    return await operations.aave.v2.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}

async function buildOperationV3({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
  addresses,
}: BuildOperationV3Args) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    addresses,
  )

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
  const adjustRiskDown = !adjustRiskUp
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: adjustRiskUp,
    isEarnPosition: args.positionType === 'Earn',
  })
  const flashloanProvider = resolveFlashloanProvider(await getForkedNetwork(dependencies.provider))

  const adjustRiskArgs = {
    collateral: {
      address: collateralTokenAddress,
      amount: depositCollateralAmountInWei,
      isEth: args.collateralToken.symbol === 'ETH',
    },
    debt: {
      address: debtTokenAddress,
      amount: depositDebtAmountInWei,
      isEth: args.debtToken.symbol === 'ETH',
    },
    deposit: {
      address: depositAddress,
      amount: depositAmount || ZERO,
    },
    swap: {
      fee: fee.toNumber(),
      data: swapData.exchangeCalldata,
      amount: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      amount: simulatedPositionTransition.delta.flashloanAmount.abs(),
      provider: flashloanProvider,
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses,
  }
  if (adjustRiskUp) {
    const borrowAmount = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)
    const adjustRiskUpArgs = {
      ...adjustRiskArgs,
      debt: {
        ...adjustRiskArgs.debt,
        borrow: {
          amount: borrowAmount,
        },
      },
    }
    return await operations.aave.v3.adjustRiskUp(adjustRiskUpArgs)
  }

  if (adjustRiskDown) {
    const withdrawCollateralAmount = simulatedPositionTransition.delta.collateral.abs()
    const adjustRiskDownArgs = {
      ...adjustRiskArgs,
      collateral: {
        ...adjustRiskArgs.collateral,
        withdrawal: {
          amount: withdrawCollateralAmount,
        },
      },
    }
    return await operations.aave.v3.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}

type GenerateTransitionArgs = {
  isIncreasingRisk: boolean
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
}

async function generateTransition({
  isIncreasingRisk,
  swapData,
  operation,
  collectFeeFrom,
  fee,
  simulatedPositionTransition,
  args,
}: GenerateTransitionArgs) {
  const fromTokenPrecision = isIncreasingRisk
    ? args.debtToken.precision
    : args.collateralToken.precision
  const toTokenPrecision = isIncreasingRisk
    ? args.collateralToken.precision
    : args.debtToken.precision

  const fromTokenAmountNormalised = amountFromWei(swapData.fromTokenAmount, fromTokenPrecision)
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    toTokenPrecision,
  )

  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )

  const finalPosition = simulatedPositionTransition.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we overestimate the fee where possible
  // And do not mislead the user
  const shouldCollectFeeFromSourceToken = collectFeeFrom === 'sourceToken'
  const sourceTokenAmount = isIncreasingRisk
    ? simulatedPositionTransition.delta.debt
    : simulatedPositionTransition.delta.collateral

  const preSwapFee = shouldCollectFeeFromSourceToken
    ? calculateFee(sourceTokenAmount, fee.toNumber())
    : ZERO
  const postSwapFee = shouldCollectFeeFromSourceToken
    ? ZERO
    : calculateFee(swapData.toTokenAmount, fee.toNumber())

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: simulatedPositionTransition.delta,
      flags: simulatedPositionTransition.flags,
      swap: {
        ...simulatedPositionTransition.swap,
        ...swapData,
        collectFeeFrom,
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
  }
}
