import BigNumber from 'bignumber.js'

import { amountFromWei, amountToWei } from '../../../helpers'
import {
  IBaseSimulatedTransition,
  IPosition,
  Position,
} from '../../../helpers/calculations/Position'
import { IRiskRatio } from '../../../helpers/calculations/RiskRatio'
import { DEFAULT_FEE, NO_FEE, TYPICAL_PRECISION, ZERO } from '../../../helpers/constants'
import { acceptedFeeToken } from '../../../helpers/swap/acceptedFeeToken'
import { getSwapDataHelper } from '../../../helpers/swap/getSwapData'
import * as operations from '../../../operations'
import { AAVEStrategyAddresses } from '../../../operations/aave/v2'
import { AaveProtocolData } from '../../../protocols/aave/getAaveProtocolData'
import {
  IOperation,
  IPositionTransition,
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
  PositionType,
  SwapData,
} from '../../../types'
import { AAVETokens } from '../../../types/aave'
import { WithV2Addresses, WithV3Addresses } from '../../../types/aave/Addresses'
import { WithFee } from '../../../types/aave/Fee'
import { WithV2Protocol, WithV3Protocol } from '../../../types/aave/Protocol'
import { getAaveTokenAddresses } from '../getAaveTokenAddresses'
import { AaveVersion } from '../getCurrentPosition'

export type AaveAdjustArgs = IPositionTransitionArgs<AAVETokens> & { positionType: PositionType }
type AaveAdjustSharedDependencies = IPositionTransitionDependencies<AAVEStrategyAddresses>
export type AaveV2AdjustDependencies = AaveAdjustSharedDependencies &
  WithV2Addresses &
  WithV2Protocol
export type AaveV3AdjustDependencies = AaveAdjustSharedDependencies &
  WithV3Addresses &
  WithV3Protocol
export type AaveAdjustDependencies = AaveV2AdjustDependencies | AaveV3AdjustDependencies

export async function adjustNew(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPositionTransition> {
  if (isRiskIncreasing(dependencies.currentPosition.riskRatio, args.multiple)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}

async function adjustRiskUp(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPositionTransition> {
  // No fee on increasing risk currently for earn
  const isEarnPosition = args.positionType === 'Earn'
  const fee = isEarnPosition ? new BigNumber(NO_FEE) : new BigNumber(DEFAULT_FEE)

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: false,
    args: {
      ...args,
      fee,
      swapAmountBeforeFees: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })

  // SimulateAdjustDown
  const {
    simulatedPositionTransition: simulatedAdjustUp,
    oracle,
    reserveEModeCategory,
  } = await simulatePositionTransition(quoteSwapData, { ...args, fee }, dependencies)

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: false,
    args: {
      ...args,
      fee,
      swapAmountBeforeFees: simulatedAdjustUp.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })

  // buildOperation
  const operation = await buildOperation({
    swapData,
    simulatedPositionTransition: simulatedAdjustUp,
    collectFeeFrom,
    reserveEModeCategory,
    args,
    dependencies,
  })

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  // generateTransition
  return await generateTransition({
    swapData,
    operation,
    simulatedPositionTransition: simulatedAdjustUp,
    args,
    oracle,
    dependencies,
  })
}

async function adjustRiskDown(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPositionTransition> {
  const fee = new BigNumber(DEFAULT_FEE)

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.collateralToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: true,
    args: {
      ...args,
      fee,
      swapAmountBeforeFees: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })

  // SimulateAdjustDown
  const {
    simulatedPositionTransition: simulatedAdjustDown,
    oracle,
    reserveEModeCategory,
  } = await simulatePositionTransition(quoteSwapData, { ...args, fee }, dependencies)

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: false,
    args: {
      ...args,
      fee,
      swapAmountBeforeFees: simulatedAdjustDown.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })

  // buildOperation
  const operation = await buildOperationV2({
    adjustRiskUp: false,
    swapData,
    simulatedPositionTransition: simulatedAdjustDown,
    collectFeeFrom,
    reserveEModeCategory,
    args,
    dependencies,
  })

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  // generateTransition
  return await generateTransition({
    swapData,
    operation,
    simulatedPositionTransition: simulatedAdjustDown,
    args,
    oracle,
    dependencies,
  })
}

function isRiskIncreasing(currentMultiple: IRiskRatio, newMultiple: IRiskRatio): boolean {
  return newMultiple.multiple.gte(currentMultiple.multiple)
}

async function simulatePositionTransition(
  quoteSwapData: SwapData,
  args: AaveAdjustArgs & WithFee,
  dependencies: AaveAdjustDependencies,
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
    reserveEModeCategory,
  } = protocolData

  const BASE = new BigNumber(10000)
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(BASE)

  const multiple = args.multiple

  const depositDebtAmountInBaseUnits = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInBaseUnits = args.depositedByUser?.collateralInWei || ZERO

  // Needs to be correct precision. First convert to base 18. Then divide
  const base18FromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, args.debtToken.precision),
    TYPICAL_PRECISION,
  )
  const base18ToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, args.collateralToken.precision),
    TYPICAL_PRECISION,
  )
  const quoteMarketPrice = base18FromTokenAmount.div(base18ToTokenAmount)
  const flashloanFee = new BigNumber(0)

  const ethPerDAI = aaveFlashloanDaiPriceInEth
  const ethPerDebtToken = aaveDebtTokenPriceInEth
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = acceptedFeeToken({
    fromToken: args.debtToken.symbol,
    toToken: args.collateralToken.symbol,
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
        debtInWei: depositDebtAmountInBaseUnits,
        collateralInWei: depositCollateralAmountInBaseUnits,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    }),
    oracle,
    reserveEModeCategory,
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

type BuildOperationV2Args = {
  protocolVersion: AaveVersion
  adjustRiskUp: boolean
  swapData: SwapData
  simulatedPositionTransition: IBaseSimulatedTransition
  collectFeeFrom: 'sourceToken' | 'targetToken'
  // reserveEModeCategory?: number | undefined
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
}

async function build

async function buildOperationV2({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  // reserveEModeCategory,
  args,
  dependencies,
}: BuildOperationV2Args) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const adjustRiskDown = !adjustRiskUp
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
      address: '0x0000000',
      amount: ZERO,
    },
    swap: {
      fee: args.positionType === 'Earn' ? NO_FEE : DEFAULT_FEE,
      data: swapData.exchangeCalldata,
      amount: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      amount: simulatedPositionTransition.delta.flashloanAmount,
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses: dependencies.addresses,
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
    return await operations.aave.v2.adjustRiskUp(adjustRiskUpArgs)
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
    return await operations.aave.v2.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}

async function buildOperationV2(args: Omit<BuildOperationArgs, 'protocolVersion'>) {
  return buildOperation({
    ...args,
    protocolVersion: AaveVersion.v2,
  })
}

type GenerateTransitionArgs = {
  swapData: SwapData
  operation: IOperation
  simulatedPositionTransition: IBaseSimulatedTransition
  oracle: BigNumber
  args: AaveAdjustArgs
  dependencies: AaveAdjustDependencies
}

async function generateTransition({
  swapData,
  operation,
  simulatedPositionTransition,
  oracle,
  args,
}: GenerateTransitionArgs) {
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, args.debtToken.precision),
    TYPICAL_PRECISION,
  )
  const toAmountWithMaxSlippage = swapData.minToTokenAmount
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(toAmountWithMaxSlippage, args.collateralToken.precision),
    TYPICAL_PRECISION,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  // EG FROM WBTC 8 to USDC 6
  // Convert WBTC fromWei
  // Apply market price
  // Convert result back to USDC at precision 6
  const collateralAmountAfterSwapInWei = amountToWei(
    amountFromWei(simulatedPositionTransition.swap.fromTokenAmount, args.debtToken.precision).div(
      actualMarketPriceWithSlippage,
    ),
    args.collateralToken.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const finalCollateralAmountAsWad = collateralAmountAfterSwapInWei.plus(
    depositCollateralAmountInWei,
  )

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    simulatedPositionTransition.position.debt,
    {
      amount: finalCollateralAmountAsWad,
      symbol: simulatedPositionTransition.position.collateral.symbol,
      precision: simulatedPositionTransition.position.collateral.precision,
    },
    oracle,
    simulatedPositionTransition.position.category,
  )

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
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}
