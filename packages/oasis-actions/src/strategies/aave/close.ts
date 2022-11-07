import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../../helpers'
import { Position } from '../../helpers/calculations/Position'
import { TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import {
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  WithLockedCollateral,
} from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'
import { getAAVETokenAddresses } from './getAAVETokenAddresses'

export async function close(
  args: IBasePositionTransitionArgs<AAVETokens> & WithLockedCollateral,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const currentPosition = dependencies.currentPosition

  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

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

  const [roundData, decimals, aaveDebtTokenPriceInEth, aaveCollateralTokenPriceInEth, swapData] =
    await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals(),
      aavePriceOracle
        .getAssetPrice(debtTokenAddress)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aavePriceOracle
        .getAssetPrice(collateralTokenAddress)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      dependencies.getSwapData(
        debtTokenAddress,
        collateralTokenAddress,
        args.collateralAmountLockedInProtocolInWei,
        args.slippage,
      ),
    ])

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  const FEE = 20
  const FEE_BASE = 10000

  const collateralPrice = aaveCollateralTokenPriceInEth.times(
    ethPrice.times(aaveDebtTokenPriceInEth),
  )

  const flashLoanAmountWei = args.collateralAmountLockedInProtocolInWei.times(collateralPrice)

  const fee = calculateFee(swapData.toTokenAmount, FEE, FEE_BASE)

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const operation = await operations.aave.close(
    {
      lockedCollateralAmountInWei: args.collateralAmountLockedInProtocolInWei,
      flashloanAmount: flashLoanAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      proxy: dependencies.proxy,
      collateralTokenAddress,
      debtTokenAddress,
    },
    dependencies.addresses,
  )

  /*
  Final position calculated using actual swap data and the latest market price
 */
  const finalPosition = new Position(
    { amount: ZERO, symbol: currentPosition.debt.symbol },
    { amount: ZERO, symbol: currentPosition.collateral.symbol },
    aaveCollateralTokenPriceInEth,
    currentPosition.category,
  )

  const flags = { requiresFlashloan: true, isIncreasingRisk: false }

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.negated(),
        collateral: currentPosition.collateral.amount.negated(),
        flashloanAmount: ZERO,
      },
      flags: flags,
      swap: {
        ...swapData,
        tokenFee: amountFromWei(fee),
        collectFeeFrom: args.collectSwapFeeFrom ?? 'sourceToken',
        sourceToken: {
          symbol: args.collateralToken.symbol,
          precision: args.collateralToken.precision ?? TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: args.debtToken.symbol,
          precision: args.debtToken.precision ?? TYPICAL_PRECISION,
        },
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}
