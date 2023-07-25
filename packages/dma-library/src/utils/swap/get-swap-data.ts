import { Address } from '@deploy-configurations/types/address'
import { SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { acceptedFeeTokenByAddress } from './accepted-fee-token'
import { calculatePreSwapFeeAmount } from './calculate-swap-fee-amount'

type GetSwapDataArgs<Tokens> = {
  swapAmountBeforeFees: BigNumber
  fromToken: { symbol: Tokens; address?: Address; precision?: number }
  toToken: { symbol: Tokens; address?: Address; precision?: number }
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
    getTokenAddress?: (token: { symbol: Tokens }, addresses: Addresses) => Address
    getSwapData: (
      fromTokenAddress: string,
      toTokenAddress: string,
      amount: BigNumber,
      slippage: BigNumber,
    ) => Promise<SwapData>
  }
}) {
  const getTokenAddress = services.getTokenAddress
  const fromTokenAddress =
    args.fromToken.address || (getTokenAddress ? getTokenAddress(args.fromToken, addresses) : null)
  const toTokenAddress =
    args.toToken.address || (getTokenAddress ? getTokenAddress(args.toToken, addresses) : null)

  if (!fromTokenAddress || !toTokenAddress) {
    throw new Error('Address(es) missing in args or getTokenAddress function missing')
  }

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
