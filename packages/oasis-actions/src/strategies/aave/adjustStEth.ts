import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei } from '../../helpers'
import { Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import type { IncreaseMultipleStEthAddresses } from '../../operations/aave/increaseMultipleStEth'
import { IStrategy } from '../types/IStrategy'
import { SwapData } from '../types/SwapData'

interface OpenStEthArgs {
  depositAmount: BigNumber // in wei
  slippage: BigNumber
  multiple: BigNumber
}
interface AdjustStEthDependencies {
  addresses: IncreaseMultipleStEthAddresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

export async function adjustStEth(
  args: OpenStEthArgs,
  dependencies: AdjustStEthDependencies,
): Promise<IStrategy> {
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
  const target = emptyPosition.adjustToTargetRiskRatio(
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
      maxLoanToValueFL: emptyPosition.category.maxLoanToValue,
      depositedByUser: {
        debt: args.depositAmount,
      },
      // debug: true,
    },
  )

  const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    target.swap.fromTokenAmount,
    slippage,
  )

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  let calls
  if (target.flags.isMultipleIncrease) {
    calls = await operations.aave.increaseMultipleStEth(
      {
        depositAmount: depositEthWei,
        flashloanAmount: target.delta.flashloanAmount,
        borrowAmount: borrowEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        ethSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.dsProxy,
      },
      dependencies.addresses,
    )
  } else {
    calls = await operations.aave.increaseMultipleStEth(
      {
        depositAmount: depositEthWei,
        flashloanAmount: target.delta.flashloanAmount,
        borrowAmount: borrowEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        ethSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.dsProxy,
      },
      dependencies.addresses,
    )
  }

  const stEthAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    target.position.debt,
    { amount: stEthAmountAfterSwapWei, denomination: target.position.collateral.denomination },
    aaveStEthPriceInEth,
    target.position.category,
  )

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
        fee: amountFromWei(target.swap.fee),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
      prices,
    },
  }
}
