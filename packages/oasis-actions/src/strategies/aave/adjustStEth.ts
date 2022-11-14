import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { IBasePosition, IPosition, Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { UNUSED_FLASHLOAN_AMOUNT, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { DecreaseMultipleStEthAddresses } from '../../operations/aave/decreaseMultipleStEth'
import type { IncreaseMultipleStEthAddresses } from '../../operations/aave/increaseMultipleStEth'
import { IStrategy } from '../types/IStrategy'
import { SwapData } from '../types/SwapData'

interface AdjustStEthArgs {
  depositAmount?: BigNumber // in wei
  slippage: BigNumber
  multiple: BigNumber
}

interface AdjustStEthDependencies {
  addresses: IncreaseMultipleStEthAddresses | DecreaseMultipleStEthAddresses
  provider: providers.Provider
  position: IBasePosition
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

export async function adjustStEth(
  args: AdjustStEthArgs,
  dependencies: AdjustStEthDependencies,
): Promise<IStrategy> {
  const FEE = 20

  const slippage = args.slippage
  const multiple = args.multiple

  const depositEthWei = args.depositAmount || ZERO

  const estimatedSwapAmount = amountToWei(new BigNumber(1))

  const existingBasePosition = dependencies.position

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
    existingBasePosition.debt,
    existingBasePosition.collateral,
    aaveStEthPriceInEth,
    existingBasePosition.category,
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
      maxLoanToValueFL: existingPosition.category.maxLoanToValue,
      depositedByUser: {
        debt: args.depositAmount,
      },
      collectSwapFeeFrom: isIncreasingRisk ? 'sourceToken' : 'targetToken',
      // debug: true,
    },
  )

  let calls
  let finalPosition: IPosition
  let actualMarketPriceWithSlippage
  let swapData
  if (target.flags.isIncreasingRisk) {
    swapData = {
      ...(await dependencies.getSwapData(
        dependencies.addresses.WETH,
        dependencies.addresses.stETH,
        target.swap.fromTokenAmount.minus(target.swap.sourceTokenFee),
        slippage,
      )),
      sourceToken: { symbol: 'WETH', precision: new BigNumber(18) },
      targetToken: { symbol: 'STETH', precision: new BigNumber(18) },
    }
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

    const flashloanAmount = target.delta?.flashloanAmount || ZERO

    calls = await operations.aave.increaseMultipleStEth(
      {
        flashloanAmount: flashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flashloanAmount,
        borrowAmount: borrowEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        ethSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.dsProxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
    const stEthAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)
    finalPosition = new Position(
      target.position.debt,
      {
        amount: stEthAmountAfterSwapWei.plus(existingPosition.collateral.amount),
        denomination: target.position.collateral.denomination,
      },
      aaveStEthPriceInEth,
      target.position.category,
    )
  } else {
    swapData = {
      ...(await dependencies.getSwapData(
        dependencies.addresses.stETH,
        dependencies.addresses.WETH,
        target.swap.fromTokenAmount,
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

    calls = await operations.aave.decreaseMultipleStEth(
      {
        flashloanAmount: absFlashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : absFlashloanAmount,
        withdrawAmount: withdrawStEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        stEthSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.dsProxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
    const ethAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)
    finalPosition = new Position(
      {
        amount: existingPosition.debt.amount.minus(ethAmountAfterSwapWei),
        denomination: target.position.collateral.denomination,
      },
      target.position.collateral,
      aaveStEthPriceInEth,
      target.position.category,
    )
  }

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }

  return {
    calls,
    simulation: {
      delta: target.delta,
      flags: target.flags,
      swap: {
        ...target.swap,
        ...swapData,
        sourceTokenFee: amountFromWei(target.swap.sourceTokenFee),
        targetTokenFee: amountFromWei(target.swap.targetTokenFee),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
      prices,
    },
  }
}
