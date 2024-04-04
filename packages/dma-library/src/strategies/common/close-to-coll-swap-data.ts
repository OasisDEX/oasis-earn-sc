import { Address } from '@deploy-configurations/types/address'
import { FEE_BASE, ONE, TEN, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { SAFETY_MARGIN } from '@dma-library/strategies/aave-like/multiply/close/constants'
import { GetSwapData } from '@dma-library/types/common'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

interface GetSwapDataToCloseToCollateralArgs {
  collateralToken: {
    symbol: string
    precision: number
    address: Address
  }
  debtToken: {
    symbol: string
    precision: number
    address: Address
  }
  colPrice: BigNumber
  debtPrice: BigNumber
  outstandingDebt: BigNumber
  slippage: BigNumber
  getSwapData: GetSwapData
  __feeOverride?: BigNumber
}

export async function getSwapDataForCloseToCollateral({
  collateralToken,
  debtToken,
  colPrice,
  debtPrice,
  outstandingDebt,
  slippage,
  getSwapData,
  __feeOverride,
}: GetSwapDataToCloseToCollateralArgs) {
  // This covers off the situation where debt balances accrue interest
  const _outstandingDebt = outstandingDebt
    .times(ONE.plus(SAFETY_MARGIN))
    .integerValue(BigNumber.ROUND_DOWN)

  // We don't want to attempt a zero debt swap with 1inch as it'll fail
  const hasZeroDebt = outstandingDebt.isZero()

  // 1.Use offset amount which will be used in the swap as well.
  // The idea is that after the debt is paid, the remaining will be transferred to the beneficiary
  // Debt is a complex number and interest rate is constantly applied.
  // We don't want to end up having leftovers of debt transferred to the user
  // so instead of charging the user a fee, we add an offset ( equal to the fee ) to the
  // collateral amount. This means irrespective of whether the fee is collected before
  // or after the swap, there will always be sufficient debt token remaining to cover the outstanding position debt.
  const fee = __feeOverride || SwapUtils.feeResolver(collateralToken.symbol, debtToken.symbol)

  // 2. Calculated the needed amount of collateral to payback the debt
  // This value is calculated based on oracle prices.
  const debtTokenPrecision = debtToken.precision
  const collateralTokenPrecision = collateralToken.precision
  const collateralNeeded = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    _outstandingDebt,
    fee.div(new BigNumber(FEE_BASE).plus(fee)),
    slippage,
  )

  // 3 Get latest market price
  // If you check i.e. https://data.chain.link/ethereum/mainnet/stablecoins/usdc-eth ,
  // there is a deviation threshold value that shows how much the prices on/off chain might differ
  // When there is a 1inch swap, we use real-time market price. To calculate that,
  // A preflight request is sent to calculate the existing market price.
  debtPrice = ONE.times(TEN.pow(debtTokenPrecision))

  const colPricePreflightSwapData = await getSwapData(
    collateralToken.address,
    debtToken.address,
    collateralNeeded.integerValue(BigNumber.ROUND_DOWN),
    slippage,
  )

  colPrice = new BigNumber(
    colPricePreflightSwapData.toTokenAmount
      .div(colPricePreflightSwapData.fromTokenAmount)
      .times(TEN.pow(collateralTokenPrecision))
      .toFixed(0),
  )

  // 4. Get Swap Data
  // This is the actual swap data that will be used in the transaction.
  // We're inflating the needed collateral by the fee amount
  // This is for when fees is collected on the other end of the swap
  const amountNeededToEnsureRemainingDebtIsRepaid = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    _outstandingDebt,
    fee.div(new BigNumber(FEE_BASE).plus(fee)),
    slippage,
  )

  const collectFeeFrom = SwapUtils.acceptedFeeTokenByAddress({
    fromTokenAddress: collateralToken.address,
    toTokenAddress: debtToken.address,
  })

  const preSwapFee =
    collectFeeFrom === 'sourceToken'
      ? calculateFee(amountNeededToEnsureRemainingDebtIsRepaid, fee.toNumber())
      : ZERO

  // 5. Get Swap Data
  // The swap amount needs to be the collateral needed minus the preSwapFee
  const amountToSwap = (
    hasZeroDebt ? TEN : amountNeededToEnsureRemainingDebtIsRepaid.minus(preSwapFee)
  ).integerValue(BigNumber.ROUND_DOWN)
  const swapData = await getSwapData(
    collateralToken.address,
    debtToken.address,
    amountToSwap,
    slippage,
  )

  return {
    swapData,
    collectFeeFrom,
    preSwapFee,
  }
}

function calculateNeededCollateralToPaybackDebt(
  debtPrice: BigNumber,
  debtPrecision: number,
  colPrice: BigNumber,
  colPrecision: number,
  debtAmount: BigNumber,
  fee: BigNumber,
  slippage: BigNumber,
) {
  // Depending on the protocol the price  could be anything.
  // i.e AAVEv3 returns the prices in USD
  //     AAVEv2 returns the prices in ETH
  // @paybackAmount - the amount denominated in the protocol base currency ( i.e. AAVEv2 - It will be in ETH, AAVEv3 - USDC)
  const paybackAmount = debtPrice.times(debtAmount)
  const paybackAmountInclFee = paybackAmount.times(ONE.plus(fee))
  // Same rule applies for @collateralAmountNeeded. @colPrice is either in USDC ( AAVEv3 ) or ETH ( AAVEv2 )
  // or could be anything eles in the following versions.
  const collateralAmountNeeded = new BigNumber(
    paybackAmount
      .plus(paybackAmount.times(fee))
      .plus(paybackAmountInclFee.times(slippage))
      .div(colPrice),
  ).integerValue(BigNumber.ROUND_DOWN)
  return collateralAmountNeeded
    .times(TEN.pow(colPrecision - debtPrecision))
    .integerValue(BigNumber.ROUND_DOWN)
}
