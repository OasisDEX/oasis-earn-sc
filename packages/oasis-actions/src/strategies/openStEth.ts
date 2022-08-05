import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../abi/chainlinkPriceFeedABI.json'
import { ONE } from '../helpers/constants'
import * as operation from '../operations'
import type { OpenStEthAddresses } from '../operations/openStEth'
import { ServiceRegistry } from '../types/ServiceRegistry'

function calculateFee(amountWei: BigNumber, fee: number, feeBase: number): BigNumber {
  return amountWei.times(new BigNumber(fee).div(feeBase)).integerValue(BigNumber.ROUND_DOWN)
}

function amountToWei(amount: BigNumber, decimals = 18): BigNumber {
  return amount.times(new BigNumber(10).pow(decimals))
}

function amountFromWei(amount: BigNumber, decimals = 18): BigNumber {
  return amount.div(new BigNumber(10).pow(decimals))
}

interface SwapData {
  fromTokenAddress: string
  toTokenAddress: string
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: any
}

interface OpenStEthArgs {
  account: string
  depositAmount: BigNumber // in wei
  slippage: BigNumber
}
interface OpenStEthDependencies {
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export async function openStEth(
  registry: ServiceRegistry,
  address: OpenStEthAddresses,
  args: OpenStEthArgs,
  dependencies: OpenStEthDependencies,
): Promise<any> {
  const chainlinkEthUsdPriceFeed = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
  const priceFeed = new ethers.Contract(
    chainlinkEthUsdPriceFeed,
    chainlinkPriceFeedABI,
    dependencies.provider,
  )
  const roundData = await priceFeed.latestRoundData()
  const decimals = await priceFeed.decimals()
  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))

  const aavePriceOracleAddress = '0xa50ba011c48153de246e5192c8f9258a2ba79ca9'
  const aavePriceOracle = new ethers.Contract(
    aavePriceOracleAddress,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const aaveWethPriceInEth = await aavePriceOracle
    .getAssetPrice(address.WETH)
    .then((amount: ethers.BigNumberish) => amount.toString())
    .then((amount: string) => new BigNumber(amount))
    .then((amount: BigNumber) => amountFromWei(amount))

  const aaveStEthPriceInEth = await aavePriceOracle
    .getAssetPrice(address.stETH)
    .then((amount: ethers.BigNumberish) => amount.toString())
    .then((amount: string) => new BigNumber(amount))
    .then((amount: BigNumber) => amountFromWei(amount))

  const FEE = 20
  const FEE_BASE = 10000
  const slippage = args.slippage

  const targetLTV = new BigNumber(0.5)
  const depositEthWei = args.depositAmount
  const stETHPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const stEthToEthRate = stETHPrice.div(ethPrice)
  const multiply = ONE.div(ONE.minus(targetLTV))

  // Borrow DAI amount from FL, and deposit it in aave
  const flashLoanAmountWei = depositEthWei.times(ethPrice).times(multiply)

  // Borrow ETH amount from AAVE
  const borrowEthAmountWei = flashLoanAmountWei.times(targetLTV).div(ethPrice)
  const fee = calculateFee(borrowEthAmountWei, FEE, FEE_BASE)
  const ethAmountToSwapWei = borrowEthAmountWei.minus(fee)

  const swapData = await dependencies.getSwapData(
    address.WETH,
    address.stETH,
    ethAmountToSwapWei,
    new BigNumber(slippage),
  )

  const marketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  const stEthAmountAfterSwapWei = ethAmountToSwapWei.div(marketPriceWithSlippage)

  console.log(`
    TEST
    aaveWethPriceInEth: ${aaveWethPriceInEth}
    aaveStEthPriceInEth: ${aaveStEthPriceInEth}

    oracle ethPrice: ${ethPrice}
    targetLTV: ${targetLTV}
    initialDeposit: ${depositEthWei}
    stETHPrice: ${stETHPrice}
  
    stEthToEthRate: ${stEthToEthRate}
    borrowEthAmountWei: ${borrowEthAmountWei}
    multiply: ${multiply}
    ethAmountToSwapWei: ${ethAmountToSwapWei}
    stEthAmountAfterSwapWei: ${stEthAmountAfterSwapWei}
    marketPriceWithSlippage: ${marketPriceWithSlippage}
    fee: ${fee}
    flashLoanAmountWei: ${flashLoanAmountWei}

    roundData: ${roundData}
    decimals: ${decimals}
  `)

  return operation.openStEth(registry, address, {
    account: args.account,
    depositAmount: depositEthWei,
    flashloanAmount: flashLoanAmountWei,
    borrowAmount: borrowEthAmountWei,
    fee: FEE,
    swapData: swapData.exchangeCalldata,
    receiveAtLeast: swapData.minToTokenAmount,
  })
}
