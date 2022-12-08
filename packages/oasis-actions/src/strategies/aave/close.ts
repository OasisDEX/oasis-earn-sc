import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei, amountToWei, calculateFee } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { Position } from '../../helpers/calculations/Position'
import { FLASHLOAN_SAFETY_MARGIN, ONE, TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
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

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const aaveProtocolDataProvider = new ethers.Contract(
    dependencies.addresses.aaveProtocolDataProvider,
    aaveProtocolDataProviderABI,
    dependencies.provider,
  )

  const FEE = 20
  const FEE_BASE = 10000
  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'
  const swapAmountBeforeFees = args.collateralAmountLockedInProtocolInWei
  const fee = calculateFee(swapAmountBeforeFees, FEE, FEE_BASE)
  const swapAmountAfterFees = swapAmountBeforeFees.minus(
    args.collectSwapFeeFrom === 'sourceToken' ? fee : ZERO,
  )

  const [
    aaveFlashloanDaiPriceInEth,
    aaveCollateralTokenPriceInEth,
    swapData,
    reserveDataForFlashloan,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    dependencies.getSwapData(
      collateralTokenAddress,
      debtTokenAddress,
      swapAmountAfterFees,
      args.slippage,
    ),
    aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
  ])

  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

  const ethPerDAI = aaveFlashloanDaiPriceInEth
  const ethPerCollateralToken = aaveCollateralTokenPriceInEth
  // EG STETH/ETH divided by ETH/DAI = STETH/ETH times by DAI/ETH = STETH/DAI
  const oracleFLtoCollateralToken = ethPerCollateralToken.div(ethPerDAI)

  const amountToFlashloanInWei = amountToWei(
    amountFromWei(args.collateralAmountLockedInProtocolInWei, args.collateralToken.precision).times(
      oracleFLtoCollateralToken,
    ),
    18,
  )
    .div(maxLoanToValueForFL.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const operation = await operations.aave.close(
    {
      lockedCollateralAmountInWei: args.collateralAmountLockedInProtocolInWei,
      flashloanAmount: amountToFlashloanInWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      proxy: dependencies.proxy,
      collectFeeFrom: collectFeeFrom,
      collateralTokenAddress,
      collateralIsEth: args.collateralToken.symbol === 'ETH',
      debtTokenAddress,
      debtTokenIsEth: args.debtToken.symbol === 'ETH',
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
        tokenFee: fee,
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
