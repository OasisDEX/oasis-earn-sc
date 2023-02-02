import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { amountFromWei, amountToWei } from '../../../helpers'
import { IBaseSimulatedTransition, Position } from '../../../helpers/calculations/Position'
import { RiskRatio } from '../../../helpers/calculations/RiskRatio'
import { DEFAULT_FEE, TYPICAL_PRECISION, ZERO } from '../../../helpers/constants'
import { acceptedFeeToken } from '../../../helpers/swap/acceptedFeeToken'
import { getSwapDataHelper } from '../../../helpers/swap/getSwapData'
import * as operations from '../../../operations'
import { AAVEStrategyAddresses } from '../../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../../operations/aave/v3'
import { AaveProtocolData, AaveProtocolDataArgs } from '../../../protocols/aave/getAaveProtocolData'
import { Address, IOperation, IPositionTransition, PositionType, SwapData } from '../../../types'
import { AAVETokens } from '../../../types/aave'
import { getAaveTokenAddresses } from '../getAaveTokenAddresses'
import { getCurrentPosition } from '../getCurrentPosition'

interface AaveOpenArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: BigNumber
  slippage: BigNumber
  positionType: PositionType
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
}

interface AaveOpenDependencies {
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses
  proxy: Address
  user: Address
  isDPMProxy: boolean
  /* Services below 👇*/
  provider: providers.Provider
  protocol: {
    version: 2 | 3
    getCurrentPosition: typeof getCurrentPosition
    getProtocolData: (args: AaveProtocolDataArgs) => AaveProtocolData
  }
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export async function open(
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
): Promise<IPositionTransition> {
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: true,
    args: {
      ...args,
      swapAmountBeforeFees: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddresses: getAaveTokenAddresses,
    },
  })
  const { simulatedPositionTransition, oracle, reserveEModeCategory } =
    await simulatePositionTransition(quoteSwapData, args, dependencies, true)

  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    fromTokenIsDebt: true,
    args: {
      ...args,
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

  return await generateTransition({
    swapData,
    operation,
    args,
    dependencies,
    oracle,
    simulatedPositionTransition,
  })
}

async function simulatePositionTransition(
  quoteSwapData: SwapData,
  args: AaveOpenArgs,
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
  const currentPosition = await dependencies.protocol.getCurrentPosition(
    {
      collateralToken: args.collateralToken,
      debtToken: args.debtToken,
      proxy: dependencies.proxy,
      protocolVersion: dependencies.protocol.version,
    },
    {
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
  )

  const protocolData = await dependencies.protocol.getProtocolData({
    collateralTokenAddress,
    debtTokenAddress,
    addresses: dependencies.addresses,
    provider: dependencies.provider,
    protocolVersion: dependencies.protocol.version,
  })

  const {
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
    reserveEModeCategory,
  } = protocolData

  const BASE = new BigNumber(10000)
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(BASE)

  const FEE = 20
  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO

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
    simulatedPositionTransition: currentPosition.adjustToTargetRiskRatio(
      new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
      {
        fees: {
          flashLoan: flashloanFee,
          oazo: new BigNumber(FEE),
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
      },
    ),
    oracle,
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

  if (protocolVersion === 3 && 'pool' in dependencies.addresses) {
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
        fee: DEFAULT_FEE,
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
    return await operations.aave.openV3(openArgs)
  }
  if (protocolVersion === 2 && 'lendingPool' in dependencies.addresses) {
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
        fee: DEFAULT_FEE,
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
    return await operations.aave.open(openArgs)
  }
}

type GenerateTransitionArgs = {
  swapData: SwapData
  operation: IOperation
  simulatedPositionTransition: IBaseSimulatedTransition
  oracle: BigNumber
  args: AaveOpenArgs
  dependencies: AaveOpenDependencies
}

async function generateTransition({
  swapData,
  operation,
  simulatedPositionTransition,
  oracle,
  args,
}: GenerateTransitionArgs) {
  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO

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
