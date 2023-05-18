import { Address } from '@deploy-configurations/types/address'
import { SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { acceptedFeeTokenByAddress } from './accepted-fee-token'
import { calculatePreSwapFeeAmount } from './calculate-swap-fee-amount'

type GetSwapDataArgs<Tokens> = {
  swapAmountBeforeFees: BigNumber
  fromToken: { symbol: Tokens; precision?: number }
  toToken: { symbol: Tokens; precision?: number }
  slippage: BigNumber
  fee?: BigNumber
}

export async function getSwapDataHelper<Addresses, Tokens>({
  args,
  addresses,
  services,
}: {
  args: GetSwapDataArgs<Tokens>
  addresses: Addresses
  services: {
    getTokenAddress: (token: { symbol: Tokens }, addresses: Addresses) => Address
    getSwapData: (
      fromTokenAddress: string,
      toTokenAddress: string,
      amount: BigNumber,
      slippage: BigNumber,
    ) => Promise<SwapData>
  }
}) {
  const fromTokenAddress = services.getTokenAddress(args.fromToken, addresses)
  const toTokenAddress = services.getTokenAddress(args.toToken, addresses)

  const collectFeeFrom = acceptedFeeTokenByAddress({
    fromTokenAddress,
    toTokenAddress,
  })

  const preSwapFee = calculatePreSwapFeeAmount(collectFeeFrom, args.swapAmountBeforeFees, args?.fee)
  const swapAmountAfterFees = args.swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await services.getSwapData(
    fromTokenAddress,
    toTokenAddress,
    swapAmountAfterFees,
    args.slippage,
  )

  return { swapData, collectFeeFrom, preSwapFee }
}
