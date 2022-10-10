import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei } from '../../helpers'
import { IBasePosition, IPosition, Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { ONE, ZERO } from '../../helpers/constants'
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
  const existingBasePosition = dependencies.position

  const priceFeed = new ethers.Contract(
    dependencies.addresses.chainlinkEthUsdPriceFeed,
    chainlinkPriceFeedABI,
    dependencies.provider,
  )

  const roundData = await priceFeed.latestRoundData()
  const decimals = await priceFeed.decimals()
  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const aaveWethPriceInEth = await aavePriceOracle
    .getAssetPrice(dependencies.addresses.WETH)
    .then((amount: ethers.BigNumberish) => amount.toString())
    .then((amount: string) => new BigNumber(amount))
    .then((amount: BigNumber) => amountFromWei(amount))

  const aaveStEthPriceInEth = await aavePriceOracle
    .getAssetPrice(dependencies.addresses.stETH)
    .then((amount: ethers.BigNumberish) => amount.toString())
    .then((amount: string) => new BigNumber(amount))
    .then((amount: BigNumber) => amountFromWei(amount))

  const existingPosition = new Position(
    existingBasePosition.debt,
    existingBasePosition.collateral,
    aaveStEthPriceInEth,
    existingBasePosition.category,
  )

  const FEE = 20

  const slippage = args.slippage
  const multiple = args.multiple

  const depositEthWei = args.depositAmount || ZERO
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const estimatedSwapAmount = new BigNumber(1)
  const quoteSwapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    estimatedSwapAmount,
    new BigNumber(slippage),
  )

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const flashloanFee = new BigNumber(0)

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
      debug: true,
    },
  )

  let calls
  let finalPosition: IPosition
  let actualMarketPriceWithSlippage
  let swapData
  if (target.flags.isIncreasingRisk) {
    swapData = await dependencies.getSwapData(
      dependencies.addresses.WETH,
      dependencies.addresses.stETH,
      target.swap.fromTokenAmount,
      slippage,
    )
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

    calls = await operations.aave.increaseMultipleStEth(
      {
        flashloanAmount: target.delta?.flashloanAmount || ZERO,
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
      { amount: stEthAmountAfterSwapWei, denomination: target.position.collateral.denomination },
      aaveStEthPriceInEth,
      target.position.category,
    )
  } else {
    swapData = await dependencies.getSwapData(
      dependencies.addresses.stETH,
      dependencies.addresses.WETH,
      target.swap.fromTokenAmount,
      slippage,
    )
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const absFlashloanAmount = (target.delta?.flashloanAmount || ZERO).abs()
    const withdrawStEthAmountWei = target.delta.collateral.abs()

    console.log('target.swap.fromTokenAmount:', target.swap.fromTokenAmount.toString())
    calls = await operations.aave.decreaseMultipleStEth(
      {
        //TODO: sort the below out before PR
        flashloanAmount: absFlashloanAmount.eq(ZERO) ? ONE : absFlashloanAmount,
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
      { amount: ethAmountAfterSwapWei, denomination: target.position.collateral.denomination },
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
