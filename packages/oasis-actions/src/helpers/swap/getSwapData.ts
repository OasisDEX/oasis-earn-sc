import BigNumber from 'bignumber.js'

import { SwapData } from '../../types'
import { acceptedFeeToken } from './acceptedFeeToken'
import { calculatePreSwapFeeAmount } from './calculatePreSwapAmount'

type GetSwapDataArgs<Tokens> = {
  swapAmountBeforeFees: BigNumber
  debtToken: { symbol: Tokens; precision?: number }
  collateralToken: { symbol: Tokens; precision?: number }
  slippage: BigNumber
  fee?: BigNumber
}

export async function getSwapDataHelper<Tokens>({
  fromTokenIsDebt,
  args,
  addressesConfig,
  services,
}: {
  fromTokenIsDebt: boolean
  args: GetSwapDataArgs<Tokens>
  addressesConfig: any //todo fix type
  services: {
    getTokenAddresses: (
      args: Pick<GetSwapDataArgs<Tokens>, 'debtToken' | 'collateralToken'>,
      addresses: any,
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
    addressesConfig,
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
