import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { IBaseSimulatedTransition, IPosition, Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, UNUSED_FLASHLOAN_AMOUNT, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IOperation } from '../types/IOperation'
import {
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
} from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'
import { SwapData } from '../types/SwapData'
import { getAAVETokenAddresses } from './getAAVETokenAddresses'

const FEE = 20

export async function adjust(
  args: IPositionTransitionArgs<AAVETokens>,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  // Params
  const slippage = args.slippage
  const multiple = args.multiple
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  const estimatedSwapAmount = amountToWei(new BigNumber(1))

  const currentPosition = dependencies.currentPosition

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
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
      dependencies.addresses.WETH,
      dependencies.addresses.stETH,
      estimatedSwapAmount,
      new BigNumber(slippage),
    ),
  ])

  const flashloanFee = new BigNumber(0)

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

  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'
  const target = existingPosition.adjustToTargetRiskRatio(
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
  const swapAmountBeforeFees = target.swap.fromTokenAmount
  const swapAmountAfterFees = swapAmountBeforeFees.minus(
    collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
  )

  if (target.flags.isIncreasingRisk) {
    ;({ operation, finalPosition, actualMarketPriceWithSlippage, swapData } = await _increaseRisk({
      target,
      existingPosition,
      swapAmountAfterFees,
      swapAmountBeforeFees,
      collectFeeFrom,
      collateralTokenAddress,
      debtTokenAddress,
      depositDebtAmountInWei,
      depositCollateralAmountInWei,
      aaveCollateralTokenPriceInEth,
      args,
      dependencies,
    }))
  } else {
    ;({ operation, finalPosition, actualMarketPriceWithSlippage, swapData } = await _decreaseRisk({
      target,
      existingPosition,
      swapAmountAfterFees,
      swapAmountBeforeFees,
      collectFeeFrom,
      collateralTokenAddress,
      debtTokenAddress,
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
      delta: target.delta,
      flags: target.flags,
      swap: {
        ...target.swap,
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

interface BranchProps {
  target: IBaseSimulatedTransition
  existingPosition: IPosition
  collateralTokenAddress: string
  depositDebtAmountInWei?: BigNumber
  depositCollateralAmountInWei?: BigNumber
  debtTokenAddress: string
  swapAmountBeforeFees: BigNumber
  swapAmountAfterFees: BigNumber
  collectFeeFrom: 'sourceToken' | 'targetToken'
  aaveCollateralTokenPriceInEth: BigNumber
  args: IPositionTransitionArgs<AAVETokens>
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>
}

async function _increaseRisk({
  target,
  existingPosition,
  swapAmountBeforeFees,
  swapAmountAfterFees,
  collectFeeFrom,
  collateralTokenAddress,
  debtTokenAddress,
  depositDebtAmountInWei,
  depositCollateralAmountInWei,
  aaveCollateralTokenPriceInEth,
  args,
  dependencies,
}: BranchProps): Promise<BranchReturn> {
  const swapData = {
    ...(await dependencies.getSwapData(
      debtTokenAddress,
      collateralTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    )),
    sourceToken: {
      ...args.debtToken,
      precision: args.debtToken.precision || TYPICAL_PRECISION,
    },
    targetToken: {
      ...args.collateralToken,
      precision: args.collateralToken.precision || TYPICAL_PRECISION,
    },
  }
  // Needs to be correct precision. First convert to base 18. Then divide
  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, args.debtToken.precision),
    18,
  )
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(swapData.toTokenAmount, args.collateralToken.precision),
    18,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  const _depositDebtAmountInWei = depositDebtAmountInWei || ZERO
  const borrowAmountInWei = target.delta.debt.minus(_depositDebtAmountInWei)
  const precisionAdjustedBorrowAmount = amountToWei(
    amountFromWei(borrowAmountInWei),
    args.debtToken.precision || TYPICAL_PRECISION,
  )

  const flashloanAmount = target.delta?.flashloanAmount || ZERO

  const operation = await operations.aave.increaseMultiple(
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
      borrowAmountInWei: precisionAdjustedBorrowAmount,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      swapAmountInWei: swapAmountBeforeFees,
      collectFeeFrom: collectFeeFrom,
      collateralTokenAddress,
      debtTokenAddress,
      proxy: dependencies.proxy,
      user: dependencies.user,
    },
    dependencies.addresses,
  )

  /*
      Final position calculated using actual swap data and the latest market price
    */
  // EG FROM WBTC 8 to USDC 6
  // Convert WBTC toWei at 18
  // Apply market price
  // Convert result back to USDC at 6
  const collateralAmountAfterSwapInWei = amountToWei(
    amountFromWei(
      amountToWei(
        amountFromWei(target.swap.fromTokenAmount, args.debtToken.precision),
        TYPICAL_PRECISION,
      ).div(actualMarketPriceWithSlippage),
      TYPICAL_PRECISION,
    ),
    args.collateralToken.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const newCollateral = {
    amount: collateralAmountAfterSwapInWei
      .plus(depositCollateralAmountInWei || ZERO)
      .plus(existingPosition.collateral.amount),
    precision: args.collateralToken.precision,
    symbol: target.position.collateral.symbol,
  }

  const finalPosition = new Position(
    target.position.debt,
    newCollateral,
    aaveCollateralTokenPriceInEth,
    target.position.category,
  )

  return {
    operation,
    finalPosition,
    actualMarketPriceWithSlippage,
    swapData,
  }
}

async function _decreaseRisk({
  target,
  existingPosition,
  swapAmountBeforeFees,
  swapAmountAfterFees,
  collectFeeFrom,
  collateralTokenAddress,
  debtTokenAddress,
  aaveCollateralTokenPriceInEth,
  args,
  dependencies,
}: BranchProps): Promise<BranchReturn> {
  const swapData = {
    ...(await dependencies.getSwapData(
      collateralTokenAddress,
      debtTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    )),
    sourceToken: {
      ...args.collateralToken,
      precision: args.collateralToken.precision || TYPICAL_PRECISION,
    },
    targetToken: {
      ...args.debtToken,
      precision: args.debtToken.precision || TYPICAL_PRECISION,
    },
  }

  // Needs to be correct precision. First convert to base 18. Then divide
  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, args.collateralToken.precision),
    18,
  )
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(swapData.toTokenAmount, args.debtToken.precision),
    18,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  const withdrawCollateralAmountWei = target.delta.collateral.abs()
  const precisionAdjustedWithdrawAmount = amountToWei(
    amountFromWei(withdrawCollateralAmountWei),
    args.collateralToken.precision || TYPICAL_PRECISION,
  )
  /*
   * The Maths can produce negative amounts for flashloan on decrease
   * because it's calculated using Debt Delta which will be negative
   */
  const absFlashloanAmount = (target.delta?.flashloanAmount || ZERO).abs()

  const operation = await operations.aave.decreaseMultiple(
    {
      flashloanAmount: absFlashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : absFlashloanAmount,
      withdrawAmountInWei: precisionAdjustedWithdrawAmount,
      receiveAtLeast: swapData.minToTokenAmount,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      swapAmountInWei: swapAmountBeforeFees,
      collectFeeFrom,
      collateralTokenAddress,
      debtTokenAddress,
      proxy: dependencies.proxy,
      user: dependencies.user,
    },
    dependencies.addresses,
  )

  /*
    Final position calculated using actual swap data and the latest market price
  */
  // EG FROM WBTC 8 to USDC 6
  // Convert WBTC toWei at 18
  // Apply market price
  // Convert result back to USDC at 6
  const debtTokenAmountAfterSwapInWei = amountToWei(
    amountFromWei(
      amountToWei(
        amountFromWei(target.swap.fromTokenAmount, args.collateralToken.precision),
        TYPICAL_PRECISION,
      ).div(actualMarketPriceWithSlippage),
      TYPICAL_PRECISION,
    ),
    args.debtToken.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  const newDebt = {
    amount: existingPosition.debt.amount.minus(debtTokenAmountAfterSwapInWei),
    precision: existingPosition.debt.precision,
    symbol: target.position.collateral.symbol,
  }

  const finalPosition = new Position(
    newDebt,
    target.position.collateral,
    aaveCollateralTokenPriceInEth,
    target.position.category,
  )

  return {
    operation,
    finalPosition,
    actualMarketPriceWithSlippage,
    swapData,
  }
}

