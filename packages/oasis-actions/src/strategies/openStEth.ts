import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../helpers'
import { calculateTargetPosition, Position } from '../helpers/calculations/calculatePosition'
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

export async function openStEth(args: OpenStEthArgs, dependencies: OpenStEthDependencies) {
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
  const flashLoanAmountWei = depositEthWei.times(ethPrice).times(args.multiply)

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
  console.log('aaveStEthPriceInEth:', aaveStEthPriceInEth.toString())
  console.log('marketPice:', marketPice.toString())
  console.log('marketPriceWithSlippage:', marketPriceWithSlippage.toString())
  const { targetPosition, debtDelta, collateralDelta, isFlashloanRequired } =
    calculateTargetPosition({
      fees: { flashLoan: new BigNumber(0), oazo: new BigNumber(FEE / FEE_BASE) },
      prices: { market: marketPice, oracle: aaveStEthPriceInEth },
      slippage: args.slippage,
      targetLoanToValue: targetLTV,
      depositedByUser: {
        debt: args.depositAmount,
      },
      currentPosition: new Position(
        { amount: new BigNumber(0) },
        { amount: new BigNumber(0) },
        stEthPrice,
        {
          liquidationThreshold: new BigNumber(0.8),
          maxLoanToValue: new BigNumber(0.8),
        },
      ),
      debug: true,
    })
  console.log('depositAmount', args.depositAmount.toString())
  const stEthAmountAfterSwapWei = ethAmountToSwapWei.div(marketPriceWithSlippage)

  console.log('isFlashloanRequired', isFlashloanRequired)
  console.log('flashloanAmount[orig]', flashLoanAmountWei.toString())
  console.log('flashloanAmount[new]', debtDelta.toString())

  console.log('borrowAmount[orig]', borrowEthAmountWei.toString())
  console.log('borrowAmount[new]', collateralDelta.toString())
  const calls = await operation.openStEth(
    {
      depositAmount: depositEthWei,
      flashloanAmount: flashLoanAmountWei,
      // flashloanAmount: debtDelta,
      // borrowAmount: collateralDelta,
      borrowAmount: borrowEthAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: ethOnExchange,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  return {
    calls,
    swapData,
    marketPice,
    stEthAmountAfterSwap: amountFromWei(stEthAmountAfterSwapWei),
    ethAmountToSwap: amountFromWei(ethAmountToSwapWei),
    feeAmount: amountFromWei(fee),
    flashLoanAmount: amountFromWei(flashLoanAmountWei),
    borrowEthAmount: amountFromWei(borrowEthAmountWei),
    ethPrice,
    stEthPrice,
    multiply: args.multiply,
    ltv: targetLTV,
  }
}
