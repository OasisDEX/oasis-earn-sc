import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../../helpers'
import { Position } from '../../helpers/calculations/Position'
import { ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionMutation } from '../types/IPositionMutation'
import {
  IBasePositionMutationArgs,
  IMutationDependencies,
  WithLockedCollateral,
  WithPosition,
} from '../types/IPositionRepository'

export async function closeStEth(
  args: IBasePositionMutationArgs<AAVETokens> & WithLockedCollateral,
  dependencies: IMutationDependencies<AAVEStrategyAddresses> & WithPosition,
): Promise<IPositionMutation> {
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
        args.collateralAmountLockedInProtocolInWei,
        args.slippage,
      ),
    ])

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  const FEE = 20
  const FEE_BASE = 10000

  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const flashLoanAmountWei = args.collateralAmountLockedInProtocolInWei.times(stEthPrice)

  const fee = calculateFee(swapData.toTokenAmount, FEE, FEE_BASE)

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  // TODO: We might want to return this and update ISimulation accordingly

  const operation = await operations.aave.closeStEth(
    {
      stEthAmount: args.collateralAmountLockedInProtocolInWei,
      flashloanAmount: flashLoanAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      dsProxy: dependencies.proxy,
    },
    dependencies.addresses,
  )

  /*
  Final position calculated using actual swap data and the latest market price
 */
  const finalPosition = new Position(
    { amount: ZERO, symbol: existingPosition.debt.symbol },
    { amount: ZERO, symbol: existingPosition.collateral.symbol },
    aaveStEthPriceInEth,
    existingPosition.category,
  )

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }

  const flags = { usesFlashloan: true, isIncreasingRisk: false }

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
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
