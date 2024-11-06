import { Address } from '@deploy-configurations/types/address'
import type { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { calculatePercentageFee } from '@dma-common/utils/swap'
import { GetSwapData } from '@dma-library/types/common'
import { ProtocolId } from '@dma-library/utils/fee-service'
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
  swapAmountBeforeFees: BigNumber
  getSwapData: GetSwapData
  __feeOverride?: BigNumber
  positionData: {
    network: Network
    protocolId: ProtocolId
    proxyAddress: string
  }
}

export async function getSwapDataForCloseToDebt({
  fromToken,
  toToken,
  slippage,
  swapAmountBeforeFees,
  getSwapData,
  __feeOverride,
  positionData,
}: GetSwapDataForCloseToDebtArgs) {
  const collectFeeFrom = SwapUtils.acceptedFeeTokenByAddress({
    fromTokenAddress: fromToken.address,
    toTokenAddress: toToken.address,
  })

  const resolvedFee = await SwapUtils.feeResolver(fromToken.symbol, toToken.symbol, {
    positionData,
  })

  const fee = __feeOverride || resolvedFee.feeToCharge

  const preSwapFee =
    collectFeeFrom === 'sourceToken'
      ? calculatePercentageFee(swapAmountBeforeFees, fee.toNumber())
      : ZERO

  const swapAmountAfterFees = swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await getSwapData(
    fromToken.address,
    toToken.address,
    swapAmountAfterFees,
    slippage,
  )

  return { swapData, collectFeeFrom, preSwapFee }
}
