import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../abi/chainlinkPriceFeedABI.json'
import { ActionCall } from '../actions/types/actionCall'
import { amountFromWei, calculateFee } from '../helpers'
import {
  calculateTargetPosition,
  IPosition,
  Position,
} from '../helpers/calculations/calculatePosition'
import { ONE } from '../helpers/constants'
import * as operation from '../operations'
import type { OpenStEthAddresses } from '../operations/openStEth'

interface SwapData {
  fromTokenAddress: string
  toTokenAddress: string
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: string | number
}

interface OpenStEthArgs {
  depositAmount: BigNumber // in wei
  slippage: BigNumber
  multiply: BigNumber
}
interface OpenStEthDependencies {
  addresses: OpenStEthAddresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

interface IStrategyReturn {
  calls: ActionCall[]
  swapData: SwapData
  targetPosition: IPosition
  swapMarketPrice: BigNumber
  swapAmount: BigNumber
  feeAmount: BigNumber
  debtTokenPrice: BigNumber
  collateralTokenPrices: BigNumber | BigNumber[]
}

export async function openStEth(
  args: OpenStEthArgs,
  dependencies: OpenStEthDependencies,
): IStrategyReturn {
  const priceFeed = new ethers.Contract(
    dependencies.addresses.chainlinkEthUsdPriceFeed,
    chainlinkPriceFeedABI,
    dependencies.provider,
  )
  const roundData = await priceFeed.latestRoundData()
  const decimals = await priceFeed.decimals()
  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  console.log('ethPrice:', ethPrice.toString())
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

  const FEE = 20
  const FEE_BASE = 10000
  const slippage = args.slippage

  const targetLTV = ONE.minus(ONE.div(args.multiply))
  const depositEthWei = args.depositAmount
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  // Borrow DAI amount from FL, and deposit it in aave

  // DODGES needing marketprice to get to swap amount because is multiplying
  // from deposited debt rather than calculating based on collateral position so market price not essential
  const flashLoanAmountWei = depositEthWei.times(ethPrice).times(args.multiply)

  // So, we could pass a quote price
  // Calculate amount to swap with the quote
  // Get back a market price
  // Pass the accurate market price into the equation to get amount to swap
  // Send that to the swap

  // Final position will differ depending on the actual swap price achieved versus slippage adjusted

  // GOAL WE NEED the rough borrow amount w/ swapdata

  // DAMIAN HAS Ignored market price:
  // Calculated borrow amount without market price
  // Used that to calculate amountToSwap
  // Passed that value into swap data to get market price

  // FROM FRONTEND
  //  const marketPrice =
  //     swap?.status === 'SUCCESS'
  //       ? swap.tokenPrice
  //       : quote?.status === 'SUCCESS'
  //       ? quote.tokenPrice
  //       : undefined

  // So, we can refine target position with a swap call
  // So, what we can do instead is:
  // 1. feed in quote + slippage as market price -> get back target position based on quote price
  // 2. use swap amount in swap params to get back updated market price

  // -> HERE we either use that amount for the swap data
  // -> Or we refine back the other way where now the swap amount is known??
  // 3. If we feed that market price back in again we end up in a recursive loop where we'll try to converge on the exact
  //    amount to swap
  // So, that's the same here then -> we're simply using it at the end to show certain details

  // So, on our side calc side we want to:
  // 1. Get a quote
  // 2. Calculate deltas / borrow amount etc
  // 3. Generate swap call data
  // 4. Refine certain fields like expected collateral using
  // 5. So, we get a target Position and we could refine this further using swap market price to get expected
  // 6. Let's call that RefinedTargetPosition

  // Borrow ETH amount from AAVE
  const borrowEthAmountWei = flashLoanAmountWei.times(targetLTV).div(ethPrice)
  const ethOnExchange = borrowEthAmountWei.plus(depositEthWei)
  const fee = calculateFee(ethOnExchange, FEE, FEE_BASE)
  const ethAmountToSwapWei = ethOnExchange.minus(fee)

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    ethAmountToSwapWei,
    new BigNumber(slippage),
  )

  const marketPice = swapData.fromTokenAmount.div(swapData.toTokenAmount)
  const marketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  // console.log('aaveStEthPriceInEth:', aaveStEthPriceInEth.toString())
  // console.log('marketPice:', marketPice.toString())
  // console.log('marketPriceWithSlippage:', marketPriceWithSlippage.toString())
  const {
    targetPosition,
    debtDelta,
    collateralDelta,
    amountToBeSwappedOrPaidback,
    isFlashloanRequired,
    flashloanAmount,
  } = calculateTargetPosition({
    fees: { flashLoan: new BigNumber(0), oazo: new BigNumber(FEE / FEE_BASE) },
    prices: { market: marketPice, oracle: aaveStEthPriceInEth },
    slippage: args.slippage,
    targetLoanToValue: targetLTV,
    maxLoanToValueFL: new BigNumber(0.75),
    depositedByUser: {
      debt: args.depositAmount,
    },

    currentPosition: new Position(
      { amount: new BigNumber(0) },
      { amount: new BigNumber(0) },
      stEthPrice,
      {
        liquidationThreshold: new BigNumber(0.81),
        maxLoanToValue: new BigNumber(0.75),
      },
    ),
    debug: true,
  })
  console.log('depositAmount', args.depositAmount.toString())
  const stEthAmountAfterSwapWei = ethAmountToSwapWei.div(marketPriceWithSlippage)

  console.log('isFlashloanRequired', isFlashloanRequired)
  console.log('flashloanAmount[orig]', flashLoanAmountWei.toString())
  console.log('flashloanAmount[new]', flashloanAmount.toString())

  console.log('borrowAmount[orig]', borrowEthAmountWei.toString())
  console.log('borrowAmount[new]', collateralDelta.toString())
  const calls = await operation.openStEth(
    {
      depositAmount: depositEthWei, // Does not change
      // flashloanAmount: flashLoanAmountWei,
      flashloanAmount: flashloanAmount, // Does change based on new market price
      // borrowAmount: collateralDelta,
      borrowAmount: amountToBeSwappedOrPaidback, // Doesn't change after first swap params call
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: ethOnExchange,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  // Could we return IStrategyReturn

  // return {
  //   calls,
  //   swapData,
  //   targetPosition: refinedTargetPosition
  //   ethAmountToSwap
  //   feeAmount
  //   ethPrice
  //   stEthPrice
  // }

  return {
    calls,
    swapData,
    swapMarketPrice: marketPice,
    // marketPice,
    // stEthAmountAfterSwap: amountFromWei(stEthAmountAfterSwapWei),
    // ethAmountToSwap: amountFromWei(ethAmountToSwapWei),
    // feeAmount: amountFromWei(fee),
    // flashLoanAmount: amountFromWei(flashLoanAmountWei),
    // borrowEthAmount: amountFromWei(borrowEthAmountWei),
    // ethPrice,
    // stEthPrice,
    // multiply: args.multiply,
    // ltv: targetLTV,
  }
}
