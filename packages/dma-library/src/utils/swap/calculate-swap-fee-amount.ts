import { DEFAULT_FEE, FEE_ESTIMATE_INFLATOR, ONE, ZERO } from '@dma-common/constants'
import { calculatePercentageFee } from '@dma-common/utils/swap'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

/**
 * Calculate the fee amount after the swap
 */
export function calculatePostSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  toTokenAmount: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
  feeType: SwapFeeType,
) {
  // if source token for post swap return zero
  if (collectFeeFrom === 'sourceToken') {
    return ZERO
  }

  if (feeType === SwapFeeType.Fixed) {
    return fee
  } else {
    return calculatePercentageFee(toTokenAmount, fee.toNumber())
  }
}

/**
 * Calculate the fee amount before the swap
 */
export function calculatePreSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
  feeType: SwapFeeType,
) {
  // if target token for pre swap return zero
  if (collectFeeFrom === 'targetToken') {
    return ZERO
  }

  if (feeType === SwapFeeType.Fixed) {
    return fee
  } else {
    return calculatePercentageFee(swapAmountBeforeFees, fee.toNumber())
  }
}

/**
 * Calculate fee amount for the swap, based on the fee type
 *  and pre or post swap fees
 */
export function calculateSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
  toTokenAmount: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
  feeType: SwapFeeType,
) {
  const preSwapFee = calculatePreSwapFeeAmount(collectFeeFrom, swapAmountBeforeFees, fee, feeType)
  const postSwapFee = calculatePostSwapFeeAmount(collectFeeFrom, toTokenAmount, fee, feeType)
  return preSwapFee.plus(postSwapFee)
}

/**
 * Calculate the inflated token fee amount
 */
export function calculateInflatedTokenFee({
  preSwapFee,
  postSwapFee,
}: {
  preSwapFee: BigNumber
  postSwapFee: BigNumber
}) {
  return preSwapFee.plus(
    postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
  )
}
