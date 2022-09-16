import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei } from '../../helpers'
import { IBasePosition, IPosition, Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { ZERO } from '../../helpers/constants'
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
  console.log('====')
  console.log('Existing position')
  console.log('Debt: ', existingBasePosition.debt.amount.toString())
  console.log('Collateral: ', existingBasePosition.collateral.amount.toString())

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

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    target.swap.fromTokenAmount,
    slippage,
  )

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  let calls
  if (target.flags.isMultipleIncrease) {
    const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

    calls = await operations.aave.increaseMultipleStEth(
      {
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
    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const absFlashloanAmount = target.delta.flashloanAmount.abs()
    const withdrawStEthAmountWei = target.delta.collateral.abs()

    calls = await operations.aave.decreaseMultipleStEth(
      {
        flashloanAmount: absFlashloanAmount,
        withdrawAmount: withdrawStEthAmountWei,
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
