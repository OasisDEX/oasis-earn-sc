import { DEFAULT_FEE, ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import BigNumber from 'bignumber.js'

export function calculatePostSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  toTokenAmount: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
) {
  return collectFeeFrom === 'targetToken' ? calculateFee(toTokenAmount, fee.toNumber()) : ZERO
}

export function calculatePreSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
) {
  return collectFeeFrom === 'sourceToken'
    ? calculateFee(swapAmountBeforeFees, fee.toNumber())
    : ZERO
}

export function calculateSwapFeeAmount(
  collectFeeFrom: 'sourceToken' | 'targetToken' | undefined,
  swapAmountBeforeFees: BigNumber,
  toTokenAmount: BigNumber,
  fee: BigNumber = new BigNumber(DEFAULT_FEE),
) {
  const feeAmount = calculatePreSwapFeeAmount(collectFeeFrom, swapAmountBeforeFees, fee)
  const postSwapFeeAmount = calculatePostSwapFeeAmount(collectFeeFrom, toTokenAmount, fee)
  return feeAmount.plus(postSwapFeeAmount)
}
