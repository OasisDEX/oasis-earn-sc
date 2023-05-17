import { SwapData } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { acceptedFeeToken } from './accepted-fee-token'
import { calculatePreSwapFeeAmount } from './calculate-swap-fee-amount'

type GetSwapDataArgs<Tokens> = {
  swapAmountBeforeFees: BigNumber
  debtToken: { symbol: Tokens; precision?: number }
  collateralToken: { symbol: Tokens; precision?: number }
  slippage: BigNumber
  fee?: BigNumber
}

export async function getSwapDataHelper<Addresses, Tokens>({
  fromTokenIsDebt,
  args,
  addresses,
  services,
}: {
  fromTokenIsDebt: boolean
  args: GetSwapDataArgs<Tokens>
  addresses: Addresses
  services: {
    getTokenAddresses: (
      args: Pick<GetSwapDataArgs<Tokens>, 'debtToken' | 'collateralToken'>,
      addresses: Addresses,
    ) => { collateralTokenAddress: string; debtTokenAddress: string }
    getSwapData: (
      fromToken: string,
      toToken: string,
      amount: BigNumber,
      slippage: BigNumber,
    ) => Promise<SwapData>
  }
}) {
  const { collateralTokenAddress, debtTokenAddress } = services.getTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    addresses,
  )

  const fromToken = fromTokenIsDebt ? debtTokenAddress : collateralTokenAddress
  const toToken = fromTokenIsDebt ? collateralTokenAddress : debtTokenAddress

  const collectFeeFrom = acceptedFeeToken({
    fromToken,
    toToken,
  })

  const preSwapFee = calculatePreSwapFeeAmount(collectFeeFrom, args.swapAmountBeforeFees, args?.fee)
  const swapAmountAfterFees = args.swapAmountBeforeFees
    .minus(preSwapFee)
    .integerValue(BigNumber.ROUND_DOWN)

  const swapData = await services.getSwapData(
    fromToken,
    toToken,
    swapAmountAfterFees,
    args.slippage,
  )

  return { swapData, collectFeeFrom, preSwapFee }
}
