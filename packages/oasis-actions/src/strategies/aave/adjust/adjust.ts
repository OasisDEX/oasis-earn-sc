import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../../../../../abi/external/aave/v2/priceOracle.json'
import { amountFromWei, amountToWei } from '../../../helpers'
import { ADDRESSES } from '../../../helpers/addresses'
import {
  IBaseSimulatedTransition,
  IPosition,
  Position,
} from '../../../helpers/calculations/Position'
import { RiskRatio } from '../../../helpers/calculations/RiskRatio'
import {
  DEFAULT_FEE,
  NO_FEE,
  ONE,
  TYPICAL_PRECISION,
  UNUSED_FLASHLOAN_AMOUNT,
  ZERO,
} from '../../../helpers/constants'
import { acceptedFeeToken } from '../../../helpers/swap/acceptedFeeToken'
import * as operations from '../../../operations'
import { AAVEStrategyAddresses } from '../../../operations/aave/v2'
import {
  IOperation,
  IPositionTransition,
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
  PositionType,
  SwapData,
} from '../../../types'
import { AAVETokens } from '../../../types/aave'
import { getAaveTokenAddresses } from '../getAaveTokenAddresses'

type AaveAdjustArgs = IPositionTransitionArgs<AAVETokens> & { positionType: PositionType }
type AaveAdjustDependencies = IPositionTransitionDependencies<AAVEStrategyAddresses>

// isAdjustRiskUp()? -> branch off here not later
//
// getQuoteSwap stuff
//

export async function adjust(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPositionTransition> {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  // Params
  const slippage = args.slippage
  const multiple = args.multiple
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  const currentPosition = dependencies.currentPosition

  let isIncreasingRisk = true
  if (
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE).loanToValue.lte(
      currentPosition.riskRatio.loanToValue,
    )
  ) {
    isIncreasingRisk = false
  }
  const fromToken = isIncreasingRisk ? args.debtToken : args.collateralToken
  const fromTokenAddress = isIncreasingRisk ? debtTokenAddress : collateralTokenAddress
  const toTokenAddress = isIncreasingRisk ? collateralTokenAddress : debtTokenAddress
  const toToken = isIncreasingRisk ? args.collateralToken : args.debtToken
  const collectFeeFrom = acceptedFeeToken({ fromToken: fromToken.symbol, toToken: toToken.symbol })
  const estimatedSwapAmount = amountToWei(new BigNumber(1), fromToken.precision)

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.priceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const [
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    quoteSwapData,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    dependencies.getSwapData(
      fromTokenAddress,
      toTokenAddress,
      estimatedSwapAmount,
      new BigNumber(slippage),
    ),
  ])

  const flashloanFee = new BigNumber(0)

  // Needs to be correct precision. First convert to base 18. Then divide
  const base18FromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, fromToken.precision),
    TYPICAL_PRECISION,
  )
  const base18ToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, toToken.precision),
    TYPICAL_PRECISION,
  )
  const quoteMarketPrice = base18FromTokenAmount.div(base18ToTokenAmount)

  // ETH/DAI
  const ethPerDAI = aaveFlashloanDaiPriceInEth

  // EG USDC/ETH
  const ethPerDebtToken = aaveDebtTokenPriceInEth

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const existingPosition = new Position(
    currentPosition.debt,
    currentPosition.collateral,
    oracle,
    currentPosition.category,
  )

  const quoteMarketPriceExpectedByMaths = isIncreasingRisk
    ? quoteMarketPrice
    : ONE.div(quoteMarketPrice)

  const isEarnPosition = args.positionType === 'Earn'
  const simulatedPositionTransition = existingPosition.adjustToTargetRiskRatio(
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
    {
      fees: {
        flashLoan: flashloanFee,
        oazo:
          isEarnPosition && isIncreasingRisk ? new BigNumber(NO_FEE) : new BigNumber(DEFAULT_FEE),
      },
      prices: {
        /**
         * This might look strange when decreasing risk
         * The maths is expecting a price in the form of COLL -> DEBT
         * Even when we're actually swapping COLL for DEBT as we are when decreasing
         * Therefore the market price is shown as the inverse of the COLL -> DEBT quote
         * */
        market: quoteMarketPriceExpectedByMaths,
        oracle: oracle,
        oracleFLtoDebtToken: oracleFLtoDebtToken,
      },
      slippage: args.slippage,
      flashloan: {
        maxLoanToValueFL: existingPosition.category.maxLoanToValue,
        tokenSymbol: 'DAI',
      },
      depositedByUser: {
        debtInWei: depositDebtAmountInWei,
        collateralInWei: depositCollateralAmountInWei,
      },
      collectSwapFeeFrom: collectFeeFrom,
      // debug: true,
    },
  )

  let operation: IOperation
  let finalPosition: IPosition
  let actualMarketPriceWithSlippage: BigNumber
  let swapData: SwapData

  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const swapAmountAfterFees = swapAmountBeforeFees.minus(
    collectFeeFrom === 'sourceToken' ? simulatedPositionTransition.swap.tokenFee : ZERO,
  )

  if (isIncreasingRisk) {
    ;({ operation, finalPosition, actualMarketPriceWithSlippage, swapData } = await _increaseRisk({
      positionType: args.positionType,
      simulatedPositionTransition,
      existingPosition,
      swapAmountAfterFees,
      swapAmountBeforeFees,
      collectFeeFrom,
      fromTokenAddress,
      toTokenAddress,
      fromToken,
      toToken,
      useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
      depositDebtAmountInWei,
      depositCollateralAmountInWei,
      aaveDebtTokenPriceInEth,
      aaveCollateralTokenPriceInEth,
      args,
      dependencies,
    }))
  } else {
    ;({ operation, finalPosition, actualMarketPriceWithSlippage, swapData } = await _decreaseRisk({
      simulatedPositionTransition,
      existingPosition,
      swapAmountAfterFees,
      swapAmountBeforeFees,
      collectFeeFrom,
      fromTokenAddress,
      fromToken,
      toTokenAddress,
      toToken,
      useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
      aaveDebtTokenPriceInEth,
      aaveCollateralTokenPriceInEth,
      args,
      dependencies,
    }))
  }

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

type BranchReturn = {
  operation: IOperation
  finalPosition: IPosition
  actualMarketPriceWithSlippage: BigNumber
  swapData: SwapData
}

interface BranchProps<AAVETokens> {
  positionType?: PositionType
  simulatedPositionTransition: IBaseSimulatedTransition
  existingPosition: IPosition
  fromTokenAddress: string
  toTokenAddress: string
  fromToken: { symbol: AAVETokens; precision?: number | undefined }
  toToken: { symbol: AAVETokens; precision?: number | undefined }
  depositDebtAmountInWei?: BigNumber
  depositCollateralAmountInWei?: BigNumber
  useFlashloan: boolean
  swapAmountBeforeFees: BigNumber
  swapAmountAfterFees: BigNumber
  collectFeeFrom: 'sourceToken' | 'targetToken'
  aaveDebtTokenPriceInEth: BigNumber
  aaveCollateralTokenPriceInEth: BigNumber
  args: IPositionTransitionArgs<AAVETokens>
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>
}

async function _increaseRisk({
  positionType,
  simulatedPositionTransition,
  existingPosition,
  swapAmountBeforeFees,
  swapAmountAfterFees,
  collectFeeFrom,
  fromTokenAddress,
  toTokenAddress,
  fromToken,
  toToken,
  useFlashloan,
  depositDebtAmountInWei,
  depositCollateralAmountInWei,
  aaveDebtTokenPriceInEth,
  aaveCollateralTokenPriceInEth,
  args,
  dependencies,
}: BranchProps<AAVETokens>): Promise<BranchReturn> {
  const swapData = {
    ...(await dependencies.getSwapData(
      fromTokenAddress,
      toTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    )),
    sourceToken: {
      ...fromToken,
      precision: fromToken.precision || TYPICAL_PRECISION,
    },
    targetToken: {
      ...toToken,
      precision: toToken.precision || TYPICAL_PRECISION,
    },
  }

  // Needs to be correct precision. First convert to base 18. Then divide
  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, fromToken.precision),
    TYPICAL_PRECISION,
  )
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(swapData.toTokenAmount, toToken.precision),
    TYPICAL_PRECISION,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  const _depositDebtAmountInWei = depositDebtAmountInWei || ZERO
  const borrowAmountInWei = simulatedPositionTransition.delta.debt.minus(_depositDebtAmountInWei)

  const flashloanAmount = simulatedPositionTransition.delta?.flashloanAmount || ZERO

  const operation = await operations.aave.v2.adjustRiskUp(
    {
      depositCollateral: {
        amountInWei: depositCollateralAmountInWei || ZERO,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      depositDebtTokens: {
        amountInWei: _depositDebtAmountInWei, // Reduces amount of borrowing required
        isEth: args.debtToken.symbol === 'ETH',
      },
      flashloanAmount: flashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flashloanAmount,
      useFlashloan,
      borrowAmountInWei: borrowAmountInWei,
      fee: positionType === 'Earn' ? NO_FEE : DEFAULT_FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      swapAmountInWei: swapAmountBeforeFees,
      collectFeeFrom: collectFeeFrom,
      fromTokenAddress,
      toTokenAddress,
      proxy: dependencies.proxy,
      user: dependencies.user,
      isDPMProxy: dependencies.isDPMProxy,
    },
    dependencies.addresses,
  )

  /*
    Final position calculated using actual swap data and the latest market price
  */
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

  const newCollateral = {
    amount: collateralAmountAfterSwapInWei
      .plus(depositCollateralAmountInWei || ZERO)
      .plus(existingPosition.collateral.amount),
    precision: args.collateralToken.precision,
    symbol: simulatedPositionTransition.position.collateral.symbol,
  }

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const finalPosition = new Position(
    simulatedPositionTransition.position.debt,
    newCollateral,
    oracle,
    simulatedPositionTransition.position.category,
  )

  return {
    operation,
    finalPosition,
    actualMarketPriceWithSlippage,
    swapData,
  }
}

async function _decreaseRisk({
  simulatedPositionTransition,
  existingPosition,
  swapAmountAfterFees,
  swapAmountBeforeFees,
  collectFeeFrom,
  fromTokenAddress,
  toTokenAddress,
  fromToken,
  toToken,
  useFlashloan,
  aaveDebtTokenPriceInEth,
  aaveCollateralTokenPriceInEth,
  args,
  dependencies,
}: BranchProps<AAVETokens>): Promise<BranchReturn> {
  const swapData = {
    ...(await dependencies.getSwapData(
      fromTokenAddress,
      toTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    )),
    sourceToken: {
      ...fromToken,
      precision: fromToken.precision || TYPICAL_PRECISION,
    },
    targetToken: {
      ...toToken,
      precision: toToken.precision || TYPICAL_PRECISION,
    },
  }

  // Needs to be correct precision. First convert to base 18. Then divide
  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, fromToken.precision),
    TYPICAL_PRECISION,
  )
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(swapData.toTokenAmount, toToken.precision),
    TYPICAL_PRECISION,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )
  const withdrawCollateralAmountWei = simulatedPositionTransition.delta.collateral.abs()

  /*
   * The Maths can produce negative amounts for flashloan on decrease
   * because it's calculated using Debt Delta which will be negative
   */
  const absFlashloanAmount = (simulatedPositionTransition.delta?.flashloanAmount || ZERO).abs()
  const operation = await operations.aave.v2.decreaseMultiple(
    {
      flashloanAmount: absFlashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : absFlashloanAmount,
      withdrawAmountInWei: withdrawCollateralAmountWei,
      receiveAtLeast: swapData.minToTokenAmount,
      fee: DEFAULT_FEE,
      swapData: swapData.exchangeCalldata,
      swapAmountInWei: swapAmountBeforeFees,
      collectFeeFrom,
      fromTokenAddress,
      toTokenAddress,
      useFlashloan,
      proxy: dependencies.proxy,
      user: dependencies.user,
      isDPMProxy: dependencies.isDPMProxy,
    },
    dependencies.addresses,
  )

  /*
    Final position calculated using actual swap data and the latest market price
  */
  const debtTokenAmount = amountFromWei(
    simulatedPositionTransition.swap.fromTokenAmount,
    args.collateralToken.precision,
  ).div(actualMarketPriceWithSlippage)
  const debtTokenAmountInBaseUnits = amountToWei(debtTokenAmount, args.debtToken.precision)

  const newDebt = {
    amount: BigNumber.max(existingPosition.debt.amount.minus(debtTokenAmountInBaseUnits), ZERO),
    precision: existingPosition.debt.precision,
    symbol: simulatedPositionTransition.position.debt.symbol,
  }

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const finalPosition = new Position(
    newDebt,
    simulatedPositionTransition.position.collateral,
    oracle,
    simulatedPositionTransition.position.category,
  )

  return {
    operation,
    finalPosition,
    actualMarketPriceWithSlippage,
    swapData,
  }
}
