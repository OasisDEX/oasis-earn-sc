import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../../helpers'
import * as operation from '../../operations'
import type { CloseStEthAddresses } from '../../operations/aave/closeStEth'

interface SwapData {
  fromTokenAddress: string
  toTokenAddress: string
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: string | number
}

interface CloseStEthArgs {
  stEthAmountLockedInAave: BigNumber
  slippage: BigNumber
}

interface CloseStEthDependencies {
  addresses: CloseStEthAddresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

export async function closeStEth(args: CloseStEthArgs, dependencies: CloseStEthDependencies) {
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

  const [roundData, decimals, aaveWethPriceInEth, aaveStEthPriceInEth, swapData] =
    await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals(),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.WETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.stETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      dependencies.getSwapData(
        dependencies.addresses.stETH,
        dependencies.addresses.WETH,
        args.stEthAmountLockedInAave,
        args.slippage,
      ),
    ])

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  const FEE = 20
  const FEE_BASE = 10000

  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const flashLoanAmountWei = args.stEthAmountLockedInAave.times(stEthPrice)

  const fee = calculateFee(swapData.toTokenAmount, FEE, FEE_BASE)

  const marketPice = swapData.fromTokenAmount.div(swapData.toTokenAmount)
  const ethAmountAfterSwapWei = swapData.minToTokenAmount

  console.log('Close: stEthAmountLockedInAave', args.stEthAmountLockedInAave.toString())
  const calls = await operation.aave.closeStEth(
    {
      stEthAmount: args.stEthAmountLockedInAave,
      flashloanAmount: flashLoanAmountWei,
      fee: FEE,
      swapData: 0,
      receiveAtLeast: new BigNumber(0),
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  return {
    calls,
    swapData,
    marketPice,
    ethAmountAfterSwap: amountFromWei(ethAmountAfterSwapWei),
    stEthAmountToSwap: amountFromWei(args.stEthAmountLockedInAave),
    feeAmount: amountFromWei(fee),
    flashLoanAmount: amountFromWei(flashLoanAmountWei),
    ethPrice,
    stEthPrice,
  }
}
