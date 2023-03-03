import BigNumber from 'bignumber.js'
import { providers } from 'ethers'
import * as ethers from 'ethers'

import { Unbox } from '../../../../../../helpers/types/common'
import operationExecutorABI from '../../../../abi/generated/operationExecutor.json'
import { IBaseSimulatedTransition, IPosition, Position } from '../../../domain/Position'
import { IRiskRatio } from '../../../domain/RiskRatio'
import { amountFromWei, amountToWei, calculateFee } from '../../../helpers'
import {
  DEFAULT_FEE,
  FEE_BASE,
  FEE_ESTIMATE_INFLATOR,
  NO_FEE,
  ONE,
  ZERO,
} from '../../../helpers/constants'
import { acceptedFeeToken } from '../../../helpers/swap/acceptedFeeToken'
import { feeResolver } from '../../../helpers/swap/feeResolver'
import { getSwapDataHelper } from '../../../helpers/swap/getSwapData'
import * as operations from '../../../operations'
import { aaveV2UniqueContractName, aaveV3UniqueContractName } from '../../../protocols/aave/config'
import { AaveProtocolData } from '../../../protocols/aave/getAaveProtocolData'
import { Address, IOperation, PositionType, SwapData } from '../../../types'
import { AAVETokens } from '../../../types/aave'
import { WithV2Addresses, WithV3Addresses } from '../../../types/aave/Addresses'
import { WithFee } from '../../../types/aave/Fee'
import { WithV2Protocol, WithV3Protocol } from '../../../types/aave/Protocol'
import { Strategy, WithMinRiskRatio } from '../../../types/common'
import { getAaveTokenAddresses } from '../getAaveTokenAddresses'
import { AaveVersion } from '../getCurrentPosition'

export interface AaveOpenArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: IRiskRatio
  slippage: BigNumber
  positionType: PositionType
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
}

export interface AaveOpenSharedDependencies {
  proxy: Address
  user: Address
  isDPMProxy: boolean
  /* Services below 👇*/
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}
export type AaveV2OpenDependencies = AaveOpenSharedDependencies & WithV2Addresses & WithV2Protocol
export type AaveV3OpenDependencies = AaveOpenSharedDependencies & WithV3Addresses & WithV3Protocol
export type AaveOpenDependencies = AaveV2OpenDependencies | AaveV3OpenDependencies

export async function open(
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
): Promise<Strategy<IPosition> & WithMinRiskRatio> {
  const fee = feeResolver(
    args.collateralToken.symbol,
    args.debtToken.symbol,
    true,
    args.positionType === 'Earn',
  )
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)
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
  const { simulatedPositionTransition, reserveEModeCategory } = await simulateStrategy(
    quoteSwapData,
    {
      ...args,
      fee,
    },
    dependencies,
    // true,
  )

  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: true,
    args: {
      ...args,
      fee,
      swapAmountBeforeFees: simulatedPositionTransition.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })

  const operation = await buildOperation(
    swapData,
    simulatedPositionTransition,
    collectFeeFrom,
    reserveEModeCategory,
    args,
    dependencies,
  )

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  return await generateStrategy({
    swapData,
    operation,
    args,
    collectFeeFrom,
    fee,
    dependencies,
    simulatedPositionTransition,
  })
}

async function simulateStrategy(
  quoteSwapData: SwapData,
  args: AaveOpenArgs & WithFee,
  dependencies: AaveOpenDependencies,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  /**
   * We've add current Position into all strategy dependencies
   * It turned out that after opening and then closing a position there might be artifacts
   * Left in a position that make it difficult to re-open it
   */
  let currentPosition: Position | undefined
  let protocolData: Unbox<AaveProtocolData> | undefined
  if (
    dependencies.protocol.version === AaveVersion.v2 &&
    aaveV2UniqueContractName in dependencies.addresses
  ) {
    currentPosition = await dependencies.protocol.getCurrentPosition(
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
    protocolData = await dependencies.protocol.getProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }
  if (
    dependencies.protocol.version === AaveVersion.v3 &&
    aaveV3UniqueContractName in dependencies.addresses
  ) {
    currentPosition = await dependencies.protocol.getCurrentPosition(
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
    protocolData = await dependencies.protocol.getProtocolData({
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }

  if (!protocolData) throw new Error('No protocol data found')
  if (!currentPosition) throw new Error('No current position found')

  const {
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
    reserveEModeCategory,
  } = protocolData

  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO

  // Needs to be correct precision.
  const fromTokenAmountNormalised = amountFromWei(
    quoteSwapData.fromTokenAmount,
    args.debtToken.precision,
  )
  const toTokenAmountNormalised = amountFromWei(
    quoteSwapData.toTokenAmount,
    args.collateralToken.precision,
  )
  const quoteMarketPrice = fromTokenAmountNormalised.div(toTokenAmountNormalised)
  const flashloanFee = new BigNumber(0)

  // ETH/DAI
  const ethPerDAI = aaveFlashloanDaiPriceInEth

  // EG USDC/ETH
  const ethPerDebtToken = aaveDebtTokenPriceInEth

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
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
        debtInWei: depositDebtAmountInWei,
        collateralInWei: depositCollateralAmountInWei,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    }),
    reserveEModeCategory,
  }
}

async function buildOperation(
  swapData: SwapData,
  simulatedPositionTransition: IBaseSimulatedTransition,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  reserveEModeCategory: number | undefined,
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
) {
  const protocolVersion = dependencies.protocol.version
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount
  const borrowAmountInWei = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)

  if (protocolVersion === AaveVersion.v3 && 'pool' in dependencies.addresses) {
    const openArgs = {
      deposit: {
        collateralToken: {
          amountInBaseUnit: depositCollateralAmountInWei,
          isEth: args.collateralToken.symbol === 'ETH',
        },
        debtToken: {
          amountInBaseUnit: depositDebtAmountInWei,
          isEth: args.debtToken.symbol === 'ETH',
        },
      },
      swapArgs: {
        fee: args.positionType === 'Earn' ? NO_FEE : DEFAULT_FEE,
        swapData: swapData.exchangeCalldata,
        swapAmountInBaseUnit: swapAmountBeforeFees,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      positionType: args.positionType,
      addresses: dependencies.addresses,
      flashloanAmount: simulatedPositionTransition.delta.flashloanAmount,
      borrowAmountInBaseUnit: borrowAmountInWei,
      collateralTokenAddress,
      debtTokenAddress,
      eModeCategoryId: reserveEModeCategory || 0,
      useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
      proxy: dependencies.proxy,
      user: dependencies.user,
      isDPMProxy: dependencies.isDPMProxy,
    }
    return await operations.aave.v3.open(openArgs)
  }
  if (protocolVersion === AaveVersion.v2 && 'lendingPool' in dependencies.addresses) {
    const openArgs = {
      deposit: {
        collateralToken: {
          amountInBaseUnit: depositCollateralAmountInWei,
          isEth: args.collateralToken.symbol === 'ETH',
        },
        debtToken: {
          amountInBaseUnit: depositDebtAmountInWei,
          isEth: args.debtToken.symbol === 'ETH',
        },
      },
      swapArgs: {
        fee: args.positionType === 'Earn' ? NO_FEE : DEFAULT_FEE,
        swapData: swapData.exchangeCalldata,
        swapAmountInBaseUnit: swapAmountBeforeFees,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      positionType: args.positionType,
      addresses: dependencies.addresses,
      flashloanAmount: simulatedPositionTransition.delta.flashloanAmount,
      borrowAmountInBaseUnit: borrowAmountInWei,
      collateralTokenAddress,
      debtTokenAddress,
      useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
      proxy: dependencies.proxy,
      user: dependencies.user,
      isDPMProxy: dependencies.isDPMProxy,
    }
    return await operations.aave.v2.open(openArgs)
  }
}

type generateStrategyArgs = {
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveOpenArgs
  dependencies: AaveOpenDependencies
}

async function generateStrategy({
  swapData,
  operation,
  collectFeeFrom,
  fee,
  simulatedPositionTransition,
  args,
  dependencies,
}: generateStrategyArgs) {
  const fromTokenAmountNormalised = amountFromWei(
    swapData.fromTokenAmount,
    args.debtToken.precision,
  )
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    args.collateralToken.precision,
  )
  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )

  const finalPosition = simulatedPositionTransition.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we over estimate the fee where possible
  // And do not mislead the user
  const shouldCollectFeeFromSourceToken = collectFeeFrom === 'sourceToken'

  const preSwapFee = shouldCollectFeeFromSourceToken
    ? calculateFee(simulatedPositionTransition.delta.debt, fee, new BigNumber(FEE_BASE))
    : ZERO
  const postSwapFee = shouldCollectFeeFromSourceToken
    ? ZERO
    : calculateFee(swapData.toTokenAmount, fee, new BigNumber(FEE_BASE))

  // Build the t/x
  const operationExecutor = new ethers.Contract(
    dependencies.addresses.operationExecutor,
    operationExecutorABI,
    dependencies.provider,
  )

  const to = dependencies.addresses.operationExecutor
  const data = operationExecutor.interface.encodeFunctionData('executeOp', [
    operation.calls,
    operation.operationName,
  ])
  const isCollateralDepositEth =
    args.collateralToken.symbol === 'ETH' &&
    args.depositedByUser?.collateralToken?.amountInBaseUnit.gt(ZERO)
  const isDebtDepositEth =
    args.debtToken.symbol === 'ETH' && args.depositedByUser?.debtToken?.amountInBaseUnit.gt(ZERO)
  const isDepositingEth = isCollateralDepositEth || isDebtDepositEth
  const ethCollateralDeposit = isCollateralDepositEth
    ? args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO
    : ZERO
  const ethDebtTokenDeposit = isDebtDepositEth
    ? args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
    : ZERO
  const ethDeposit = ethCollateralDeposit.plus(ethDebtTokenDeposit)

  const swap = {
    ...simulatedPositionTransition.swap,
    ...swapData,
    collectFeeFrom,
    tokenFee: preSwapFee.plus(
      postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
    ),
  }

  return {
    simulation: {
      swaps: [swap],
      targetPosition: finalPosition,
      position: finalPosition,
    },
    tx: {
      to,
      data,
      value: isDepositingEth ? ethers.utils.parseUnits(ethDeposit.toString(), 18).toString() : '0',
    },
    // COMPOSE THIS IN TO STRATEGY TYPE
    minRiskRatio: finalPosition.minConfigurableRiskRatio(expectedMarketPriceWithSlippage),
    // transaction: {
    //   calls: operation.calls,
    //   operationName: operation.operationName,
    // },
    // simulation: {
    // LET'S ASSUME WE DON'T NEED THIS EITHER
    // delta: simulatedPositionTransition.delta,
    // LET'S ASSUME WE DON'T NEED THIS
    // flags: simulatedPositionTransition.flags,
    // swap: {
    //   ...simulatedPositionTransition.swap,
    //   ...swapData,
    //   collectFeeFrom,
    //   tokenFee: preSwapFee.plus(
    //     postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
    //   ),
    // },
    // position: finalPosition,

    // },
  }
}
