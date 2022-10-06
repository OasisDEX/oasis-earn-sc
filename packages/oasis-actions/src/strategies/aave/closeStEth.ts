import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../../helpers'
import { IBasePosition, Position } from '../../helpers/calculations/Position'
import { ONE, TEN_THOUSAND, ZERO } from '../../helpers/constants'
import * as operation from '../../operations'
import type { CloseStEthAddresses } from '../../operations/aave/closeStEth'
import { IStrategy } from '../types/IStrategy'
import { SwapData } from '../types/SwapData'

interface CloseStEthArgs {
  stEthAmountLockedInAave: BigNumber
  slippage: BigNumber
}

interface CloseStEthDependencies {
  addresses: CloseStEthAddresses
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

export async function closeStEth(
  args: CloseStEthArgs,
  dependencies: CloseStEthDependencies,
): Promise<IStrategy> {
  const existingPosition = dependencies.position

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

  console.log('args.stEthAmountLockedInAave', args.stEthAmountLockedInAave.toString())
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

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  // TODO: We might want to return this and update ISimulation accordingly
  // const ethAmountAfterSwapWei = swapData.minToTokenAmount

  const calls = await operation.aave.closeStEth(
    {
      stEthAmount: args.stEthAmountLockedInAave,
      flashloanAmount: flashLoanAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  /*
  Final position calculated using actual swap data and the latest market price
 */
  const finalPosition = new Position(
    { amount: ZERO, denomination: existingPosition.debt.denomination },
    { amount: ZERO, denomination: existingPosition.collateral.denomination },
    aaveStEthPriceInEth,
    existingPosition.category,
  )

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }

  const flags = { usesFlashloan: true, isIncreasingRisk: false }

  return {
    calls,
    simulation: {
      delta: {
        debt: existingPosition.debt.amount.negated(),
        collateral: existingPosition.collateral.amount.negated(),
      },
      flags: flags,
      swap: {
        ...swapData,
        sourceTokenFee: amountFromWei(fee),
        targetTokenFee: ZERO,
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
      prices,
    },
  }
}
