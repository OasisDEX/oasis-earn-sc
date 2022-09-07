import BigNumber from 'bignumber.js'
import { Contract, ethers, providers } from 'ethers'

import aaveLendingPoolABI from '../abi/aaveLendingPool.json'
import aavePriceOracleABI from '../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../abi/chainlinkPriceFeedABI.json'
import { ActionCall } from '../actions/types/actionCall'
import { amountFromWei, calculateFee } from '../helpers'
import { IPosition, Position } from '../helpers/calculations/calculatePosition'
import { ONE, ZERO } from '../helpers/constants'
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
  multiple: BigNumber
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

export interface IStrategyReturn {
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
): Promise<IStrategyReturn> {
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

  const aaveDaiPriceInEth = await aavePriceOracle
    .getAssetPrice(dependencies.addresses.DAI)
    .then((amount: ethers.BigNumberish) => amount.toString())
    .then((amount: string) => new BigNumber(amount))
    .then((amount: BigNumber) => amountFromWei(amount))

  console.log('aaveStEthPriceInEth:', aaveStEthPriceInEth.toString())
  console.log('aaveDaiPriceInEth:', aaveDaiPriceInEth.toString())
  // https://docs.aave.com/risk/v/aave-v2/asset-risk/risk-parameters
  const liquidationThreshold = new BigNumber(0.75)
  const maxLoanToValue = new BigNumber(0.73)

  const FEE = 20
  const FEE_BASE = 10000
  console.log('after userAccountData...')
  const slippage = args.slippage
  const multiple = args.multiple
  // const targetLTV = ONE.minus(ONE.div(args.multiply))
  const depositEthWei = args.depositAmount
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))
  console.log('stEthPrice:', stEthPrice.toString())
  const emptyPosition = new Position({ amount: ZERO }, { amount: ZERO }, aaveStEthPriceInEth, {
    liquidationThreshold,
    maxLoanToValue,
  })

  const estimatedSwapAmount = new BigNumber(1)
  const quoteSwapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    estimatedSwapAmount,
    new BigNumber(slippage),
  )

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const oazoFee = new BigNumber(FEE / FEE_BASE)
  const flashloanFee = new BigNumber(0)
  const {
    targetPosition,
    debtDelta,
    collateralDelta,
    amountToBeSwappedOrPaidback: ethAmountToSwap,
    // isFlashloanRequired,
    flashloanAmount,
  } = emptyPosition.adjustToTargetMultiple(multiple, {
    fees: { flashLoan: flashloanFee, oazo: oazoFee },
    prices: {
      market: quoteMarketPrice,
      oracle: aaveStEthPriceInEth,
      oracleFLtoDebtToken: ethPrice,
    },
    slippage: args.slippage,
    maxLoanToValueFL: emptyPosition.category.maxLoanToValue,
    depositedByUser: {
      debt: args.depositAmount,
    },
    debug: true,
  })
  // TODO: Return from adjustToTargetLTV
  const fee = ethAmountToSwap.div(ONE.minus(oazoFee))

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    ethAmountToSwap,
    slippage,
  )

  const actualMarketPrice = swapData.fromTokenAmount.div(swapData.toTokenAmount)
  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const borrowEthAmountWei = debtDelta.minus(depositEthWei)
  console.log('calls: ', {
    depositAmount: depositEthWei.toString(),
    flashloanAmount: flashloanAmount.toString(),
    borrowAmount: borrowEthAmountWei.toString(),
    fee: FEE.toString(),
    swapData: swapData.exchangeCalldata,
    receiveAtLeast: swapData.minToTokenAmount.toString(),
    ethSwapAmount: ethAmountToSwap.toString(),
    dsProxy: dependencies.dsProxy,
  })
  const calls = await operation.openStEth(
    {
      depositAmount: depositEthWei,
      flashloanAmount: flashloanAmount,
      borrowAmount: borrowEthAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: ethAmountToSwap,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )
  // Collateral Delta
  const stEthAmountAfterSwapWei = ethAmountToSwap.div(actualMarketPriceWithSlippage)
  // Can we generate a final position here?

  return {
    calls,
    swapData,
    targetPosition,
    swapMarketPrice: actualMarketPrice,
    swapAmount: amountFromWei(ethAmountToSwap),
    feeAmount: amountFromWei(fee),
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }
}
