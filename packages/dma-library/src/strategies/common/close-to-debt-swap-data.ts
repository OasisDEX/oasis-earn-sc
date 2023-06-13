import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { GetSwapData } from '@dma-library/types/common'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

interface GetSwapDataForCloseToDebtArgs {
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
  swapAmountBeforeFees$: BigNumber
  getSwapData: GetSwapData
}

export async function getSwapDataForCloseToDebt({
  fromToken,
  toToken,
  slippage,
  swapAmountBeforeFees$,
  getSwapData,
}: GetSwapDataForCloseToDebtArgs) {
  const collectFeeFrom = SwapUtils.acceptedFeeTokenByAddress({
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
  })

  const fee = SwapUtils.feeResolver(fromToken.symbol, toToken.symbol)

  const preSwapFee$ =
    collectFeeFrom === 'sourceToken' ? calculateFee(swapAmountBeforeFees$, fee.toNumber()) : ZERO

  const swapAmountAfterFees$ = swapAmountBeforeFees$
    .minus(preSwapFee$)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await getSwapData(
    fromToken.address,
    toToken.address,
    swapAmountAfterFees$,
    slippage,
  )

  console.log('GET SWAP DATA')
  console.log(swapData)
  console.log(swapAmountAfterFees$.toString())

  return { swapData, collectFeeFrom, preSwapFee$ }
}
