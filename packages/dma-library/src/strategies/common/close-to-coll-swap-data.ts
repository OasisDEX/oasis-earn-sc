import { Address } from '@deploy-configurations/types/address'
import { FEE_BASE, ONE, TEN, ZERO } from '@dma-common/constants'
import { areAddressesEqual } from '@dma-common/utils/addresses'
import { calculateFee } from '@dma-common/utils/swap'
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
  ETHAddress: Address
  getSwapData: GetSwapData
}

export async function getSwapDataForCloseToCollateral({
  collateralToken,
  debtToken,
  colPrice,
  debtPrice,
  outstandingDebt,
  slippage,
  ETHAddress,
  getSwapData,
}: GetSwapDataToCloseToCollateralArgs) {
  // 1.Use offset amount which will be used in the swap as well.
  // The idea is that after the debt is paid, the remaining will be transferred to the beneficiary
  // Debt is a complex number and interest rate is constantly applied.
  // We don't want to end up having leftovers of debt transferred to the user
  // so instead of charging the user a fee, we add an offset ( equal to the fee ) to the
  // collateral amount. This means irrespective of whether the fee is collected before
  // or after the swap, there will always be sufficient debt token remaining to cover the outstanding position debt.
  const fee = SwapUtils.feeResolver(collateralToken.symbol, debtToken.symbol)

  // 2. Calculated the needed amount of collateral to payback the debt
  // This value is calculated based on oracle prices.
  const debtTokenPrecision = debtToken.precision
  const collateralTokenPrecision = collateralToken.precision
  const collateralNeeded = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    outstandingDebt,
    fee,
    slippage,
  )

  // 3 Get latest market price
  // If you check i.e. https://data.chain.link/ethereum/mainnet/stablecoins/usdc-eth ,
  // there is a deviation threshold value that shows how much the prices on/off chain might differ
  // When there is a 1inch swap, we use real-time market price. To calculate that,
  // A preflight request is sent to calculate the existing market price.
  const debtIsEth = areAddressesEqual(debtToken.address, ETHAddress)
  const collateralIsEth = areAddressesEqual(collateralToken.address, ETHAddress)

  if (debtIsEth) {
    debtPrice = ONE.times(TEN.pow(debtTokenPrecision))
  } else {
    const debtPricePreflightSwapData = await getSwapData(
      debtToken.address,
      ETHAddress,
      outstandingDebt,
      slippage,
      true, // inverts swap mock in tests ignored in prod
    )
    debtPrice = new BigNumber(
      debtPricePreflightSwapData.toTokenAmount
        .div(debtPricePreflightSwapData.fromTokenAmount)
        .times(TEN.pow(debtTokenPrecision))
        .toFixed(0),
    )
  }

  if (collateralIsEth) {
    colPrice = ONE.times(TEN.pow(collateralTokenPrecision))
  } else {
    const colPricePreflightSwapData =
      !collateralIsEth &&
      (await getSwapData(collateralToken.address, ETHAddress, collateralNeeded, slippage))

    colPrice = new BigNumber(
      colPricePreflightSwapData.toTokenAmount
        .div(colPricePreflightSwapData.fromTokenAmount)
        .times(TEN.pow(collateralTokenPrecision))
        .toFixed(0),
    )
  }

  // 4. Get Swap Data
  // This is the actual swap data that will be used in the transaction.
  const amountNeededToEnsureRemainingDebtIsRepaid = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    outstandingDebt,
    fee.div(FEE_BASE),
    slippage,
  )

  const swapData = await getSwapData(
    collateralToken.address,
    debtToken.address,
    amountNeededToEnsureRemainingDebtIsRepaid,
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
  return collateralAmountNeeded.times(TEN.pow(colPrecision - debtPrecision))
}
