import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ONE, TEN, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { buildOperation } from '@dma-library/strategies/aave/close/build-operation'
import { generateTransition } from '@dma-library/strategies/aave/close/generate-transition'
import { getValuesFromProtocol } from '@dma-library/strategies/aave/close/get-values-from-protocol'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/get-aave-token-addresses'
import { PositionTransition } from '@dma-library/types'
import { acceptedFeeToken } from '@dma-library/utils/swap/accepted-fee-token'
import { feeResolver } from '@dma-library/utils/swap/fee-resolver'
import BigNumber from 'bignumber.js'

import { AaveCloseArgs, AaveCloseArgsWithVersioning, AaveCloseDependencies } from './types'

export async function close(
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<PositionTransition> {
  const getSwapData = args.shouldCloseToCollateral
    ? getSwapDataToCloseToCollateral
    : getSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies)

  const flashloanToken =
    dependencies.network === Network.MAINNET
      ? dependencies.addresses.DAI
      : dependencies.addresses.USDC

  const operation = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee },
    flashloanToken,
    args,
    dependencies,
  )

  return generateTransition(swapData, collectFeeFrom, preSwapFee, operation, args, dependencies)
}

async function getSwapDataToCloseToCollateral(
  { debtToken, collateralToken, slippage, protocolVersion }: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  // Since we cannot get the exact amount that will be needed
  // to cover all debt, there will be left overs of the debt token
  // which will then have to be transferred back to the user
  let [, colPrice, debtPrice] = (
    await getValuesFromProtocol(
      protocolVersion,
      collateralTokenAddress,
      debtTokenAddress,
      dependencies,
    )
  ).map(price => {
    return new BigNumber(price.toString())
  })

  // 1.Use offset amount which will be used in the swap as well.
  // The idea is that after the debt is paid, the remaining will be transferred to the beneficiary
  // Debt is a complex number and interest rate is constantly applied.
  // We don't want to end up having leftovers of debt transferred to the user
  // so instead of charging the user a fee, we add an offset ( equal to the fee ) to the
  // collateral amount. This means irrespective of whether the fee is collected before
  // or after the swap, there will always be sufficient debt token remaining to cover the outstanding position debt.
  const fee = feeResolver(collateralToken.symbol, debtToken.symbol) // as DECIMAL number
  const debtTokenPrecision = debtToken.precision || TYPICAL_PRECISION
  const collateralTokenPrecision = collateralToken.precision || TYPICAL_PRECISION

  // 2. Calculated the needed amount of collateral to payback the debt
  // This value is calculated based on the AAVE protocol oracles.
  // At the time of writing, their main source are Chainlink oracles.
  const collateralNeeded = calculateNeededCollateralToPaybackDebt(
    debtPrice,
    debtTokenPrecision,
    colPrice,
    collateralTokenPrecision,
    dependencies.currentPosition.debt.amount,
    fee,
    slippage,
  )

  // 3 Get latest market price
  // If you check i.e. https://data.chain.link/ethereum/mainnet/stablecoins/usdc-eth ,
  // there is a deviation threshold value that shows how much the prices on/off chain might differ
  // When there is a 1inch swap, we use real-time market price. To calculate that,
  // A preflight request is sent to calculate the existing market price.
  const debtIsEth = debtTokenAddress === dependencies.addresses.ETH
  const collateralIsEth = collateralTokenAddress === dependencies.addresses.ETH

  if (debtIsEth) {
    debtPrice = ONE.times(TEN.pow(debtTokenPrecision))
  } else {
    const debtPricePreflightSwapData = await dependencies.getSwapData(
      debtTokenAddress,
      dependencies.addresses.ETH,
      dependencies.currentPosition.debt.amount,
      slippage,
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
      (await dependencies.getSwapData(
        collateralTokenAddress,
        dependencies.addresses.ETH,
        collateralNeeded,
        slippage,
      ))

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
    dependencies.currentPosition.debt.amount,
    fee.div(FEE_BASE),
    slippage,
  )

  const swapData = await dependencies.getSwapData(
    collateralTokenAddress,
    debtTokenAddress,
    amountNeededToEnsureRemainingDebtIsRepaid,
    slippage,
  )

  const collectFeeFrom = acceptedFeeToken({
    fromToken: collateralTokenAddress,
    toToken: debtTokenAddress,
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

async function getSwapDataToCloseToDebt(
  { debtToken, collateralToken, slippage, collateralAmountLockedInProtocolInWei }: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  const swapAmountBeforeFees = collateralAmountLockedInProtocolInWei

  const collectFeeFrom = acceptedFeeToken({
    fromToken: collateralTokenAddress,
    toToken: debtTokenAddress,
  })

  const fee = feeResolver(collateralToken.symbol, debtToken.symbol)

  const preSwapFee =
    collectFeeFrom === 'sourceToken' ? calculateFee(swapAmountBeforeFees, fee.toNumber()) : ZERO

  const swapAmountAfterFees = swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await dependencies.getSwapData(
    collateralTokenAddress,
    debtTokenAddress,
    swapAmountAfterFees,
    slippage,
  )

  return { swapData, collectFeeFrom, preSwapFee }
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
