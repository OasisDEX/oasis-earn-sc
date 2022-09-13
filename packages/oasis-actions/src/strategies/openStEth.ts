import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../abi/chainlinkPriceFeedABI.json'
import { ActionCall } from '../actions/types/actionCall'
import { amountFromWei, calculateFee } from '../helpers'
import { IPosition, Position } from '../helpers/calculations/Position'
import { RiskRatio } from '../helpers/calculations/RiskRatio'
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
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
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

  // https://docs.aave.com/risk/v/aave-v2/asset-risk/risk-parameters
  const liquidationThreshold = new BigNumber(0.75)
  const maxLoanToValue = new BigNumber(0.73)
  const dustLimit = new BigNumber(0)

  const FEE = 20

  const slippage = args.slippage
  const multiple = args.multiple

  const depositEthWei = args.depositAmount
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const emptyPosition = new Position({ amount: ZERO }, { amount: ZERO }, aaveStEthPriceInEth, {
    liquidationThreshold,
    maxLoanToValue,
    dustLimit,
  })

  const estimatedSwapAmount = new BigNumber(1)
  const quoteSwapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    estimatedSwapAmount,
    new BigNumber(slippage),
  )

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const flashloanFee = new BigNumber(0)
  const { targetPosition, debtDelta, fee, fromTokenAmount, flashloanAmount } =
    emptyPosition.adjustToTargetRiskRatio(new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE), {
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
      maxLoanToValueFL: emptyPosition.category.maxLoanToValue,
      depositedByUser: {
        debt: args.depositAmount,
      },
      // debug: true,
    })

  const borrowEthAmountWei = debtDelta.minus(depositEthWei)

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    fromTokenAmount,
    slippage,
  )

  const actualMarketPrice = swapData.fromTokenAmount.div(swapData.toTokenAmount)
  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const calls = await operation.openStEth(
    {
      depositAmount: depositEthWei,
      flashloanAmount,
      borrowAmount: borrowEthAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: fromTokenAmount,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  const stEthAmountAfterSwapWei = fromTokenAmount.div(actualMarketPriceWithSlippage)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    targetPosition.debt,
    { amount: stEthAmountAfterSwapWei, denomination: targetPosition.collateral.denomination },
    aaveStEthPriceInEth,
    targetPosition.category,
  )

  return {
    calls,
    swapData,
    targetPosition: finalPosition,
    swapMarketPrice: actualMarketPrice,
    fromTokenAmount: amountFromWei(fromTokenAmount),
    toTokenAmount: amountFromWei(fromTokenAmount),
    feeAmount: amountFromWei(fee),
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }
}
