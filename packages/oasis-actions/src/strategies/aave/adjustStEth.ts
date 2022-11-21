import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { IPosition, Position, PositionBalance } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { UNUSED_FLASHLOAN_AMOUNT, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IOperation } from '../types/IOperation'
import {
  IPositionTransitionDependencies,
  IPositionTransitionArgs,
} from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'

export async function adjustStEth(
  args: IPositionTransitionArgs<AAVETokens>,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const FEE = 20

  const slippage = args.slippage
  const multiple = args.multiple

  const depositEthWei = args.depositedByUser?.debtInWei || ZERO

  const estimatedSwapAmount = amountToWei(new BigNumber(1))

  const currentPosition = dependencies.currentPosition

  const priceFeed = new ethers.Contract(
    dependencies.addresses.chainlinkEthUsdPriceFeed,
    chainlinkPriceFeedABI,
    dependencies.provider,
  )

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const [roundData, decimals, aaveWethPriceInEth, aaveStEthPriceInEth, quoteSwapData] =
    await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals(),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.WETH)
        .then((amount: ethers.BigNumberish) => amount.toString())
        .then((amount: string) => new BigNumber(amount))
        .then((amount: BigNumber) => amountFromWei(amount)),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.stETH)
        .then((amount: ethers.BigNumberish) => amount.toString())
        .then((amount: string) => new BigNumber(amount))
        .then((amount: BigNumber) => amountFromWei(amount)),
      dependencies.getSwapData(
        dependencies.addresses.WETH,
        dependencies.addresses.stETH,
        estimatedSwapAmount,
        new BigNumber(slippage),
      ),
    ])

  const existingPosition = new Position(
    currentPosition.debt,
    currentPosition.collateral,
    aaveStEthPriceInEth,
    currentPosition.category,
  )

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const flashloanFee = new BigNumber(0)

  const targetLTV = new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE).loanToValue
  let isIncreasingRisk = false

  if (targetLTV.gt(existingPosition.riskRatio.loanToValue)) {
    isIncreasingRisk = true
  }

  const target = existingPosition.adjustToTargetRiskRatio(
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
    {
      fees: {
        flashLoan: flashloanFee,
        oazo: new BigNumber(FEE),
      },
      prices: {
        market: quoteMarketPrice,
        oracle: aaveStEthPriceInEth,
        oracleFLtoDebtToken: ethPrice,
      },
      slippage: args.slippage,
      flashloan: {
        maxLoanToValueFL: existingPosition.category.maxLoanToValue,
        tokenSymbol: 'DAI',
      },
      depositedByUser: {
        debtInWei: depositEthWei,
      },
      collectSwapFeeFrom: isIncreasingRisk ? 'sourceToken' : 'targetToken',
      // debug: true,
    },
  )

  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'

  let operation: IOperation
  let finalPosition: IPosition
  let actualMarketPriceWithSlippage
  let swapData
  if (target.flags.isIncreasingRisk) {
    swapData = {
      ...(await dependencies.getSwapData(
        dependencies.addresses.WETH,
        dependencies.addresses.stETH,
        target.swap.fromTokenAmount.minus(
          collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
        ),

        slippage,
      )),
      sourceToken: { symbol: 'WETH', precision: new BigNumber(18) },
      targetToken: { symbol: 'STETH', precision: new BigNumber(18) },
    }
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

    const flashloanAmount = target.delta?.flashloanAmount || ZERO

    operation = await operations.aave.increaseMultipleStEth(
      {
        flashloanAmount: flashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flashloanAmount,
        borrowAmount: borrowEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        ethSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.proxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
    const stEthAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)
    finalPosition = new Position(
      new PositionBalance(target.position.debt),
      new PositionBalance({
        amount: stEthAmountAfterSwapWei.plus(existingPosition.collateral.amount),
        symbol: target.position.collateral.symbol,
      }),
      aaveStEthPriceInEth,
      target.position.category,
    )
  } else {
    swapData = {
      ...(await dependencies.getSwapData(
        dependencies.addresses.stETH,
        dependencies.addresses.WETH,
        target.swap.fromTokenAmount.minus(
          collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
        ),
        slippage,
      )),
      sourceToken: { symbol: 'STETH', precision: new BigNumber(18) },
      targetToken: { symbol: 'WETH', precision: new BigNumber(18) },
    }
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const absFlashloanAmount = (target.delta?.flashloanAmount || ZERO).abs()
    const withdrawStEthAmountWei = target.delta.collateral.abs()

    operation = await operations.aave.decreaseMultipleStEth(
      {
        flashloanAmount: absFlashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : absFlashloanAmount,
        withdrawAmount: withdrawStEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        stEthSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.proxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
    const ethAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)
    finalPosition = new Position(
      new PositionBalance({
        amount: existingPosition.debt.amount.minus(ethAmountAfterSwapWei),
        symbol: target.position.collateral.symbol,
      }),
      new PositionBalance(target.position.collateral),
      aaveStEthPriceInEth,
      target.position.category,
    )
  }

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
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
        tokenFee: amountFromWei(target.swap.tokenFee),
        sourceToken: { symbol: 'STETH', precision: 18 },
        targetToken: { symbol: 'WETH', precision: 18 },
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}
