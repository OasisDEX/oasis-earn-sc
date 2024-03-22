import { Address } from '@deploy-configurations/types/address'
import { FEE_ESTIMATE_INFLATOR } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { GetSwapData } from '@dma-library/types/common'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { ONE, ZERO } from '../../../../dma-common/constants/numbers'

interface GetGenericSwapDataArgs {
  fromToken: {
    symbol: string
    precision: number
    address: Address
  }
  toToken: {
    symbol: string
    precision: number
    address: Address
  }
  slippage: BigNumber
  swapAmountBeforeFees: BigNumber
  getSwapData: GetSwapData
  __feeOverride?: BigNumber
}

export async function getGenericSwapData({
  fromToken,
  toToken,
  slippage,
  swapAmountBeforeFees,
  getSwapData,
  __feeOverride,
}: GetGenericSwapDataArgs) {
  const collectFeeFrom = SwapUtils.acceptedFeeTokenByAddress({
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
  })

  const fee = __feeOverride || SwapUtils.feeResolver(fromToken.symbol, toToken.symbol)

  const preSwapFee =
    collectFeeFrom === 'sourceToken' ? calculateFee(swapAmountBeforeFees, fee.toNumber()) : ZERO

  const swapAmountAfterFees = swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await getSwapData(
    fromToken.address,
    toToken.address,
    swapAmountAfterFees,
    slippage,
  )
  const postSwapFee =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO

  const tokenFee = preSwapFee.plus(
    postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
  )
  return { swapData, collectFeeFrom, fee: fee.toString(), tokenFee }
}
