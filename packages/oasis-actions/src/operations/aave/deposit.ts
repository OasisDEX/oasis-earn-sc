import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES } from '../../helpers/constants'
import { isDefined } from '../../helpers/isDefined'

interface SwapArgs {
  fee: number
  receiveAtLeast: BigNumber
  calldata: string
  collectFeeInFromToken: boolean
}

// TODO: Probably put a generic about the tokens i.e DepositArgs<Tokens> and provide AAVETokens
// TODO: Take into consideration the precision for the tokens. So indeed might be a good idea for the Tokens generics
export interface DepositArgs {
  // - either for a swap where the `entryToken` will be exchanged for the `depositToken`
  // - or it will be directly deposited in the protocol
  entryToken: string
  // - either used for a swap if `entryToken` is swapped for `depositToken`
  // - or it will be directly deposited in the protocol
  amount: BigNumber
  // - if it's omitted that means that the `entryToken` with bbe used in the deposit
  // - if it's provided that means that the `entryToken` will be swapped for `depositToken`
  depositToken: string
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: string
  // In order to borrow assets on aave the deposited ones ( lent ) should be allowed to be used as collateral.
  allowDepositTokenAsCollateral: boolean
  // Must be provided if `depositToken` is also provided
  swapArgs?: SwapArgs
}

function getSwapCalls(
  depositToken: string,
  entryToken: string,
  amount: BigNumber,
  swapArgs: SwapArgs | undefined,
  ETH: string,
  WETH: string,
) {
  const isSwapNeeded = depositToken !== entryToken
  const actualAssetToSwap = entryToken != ETH ? entryToken : WETH

  if (
    isSwapNeeded &&
    isDefined(swapArgs, 'Swap arguments are needed when deposit token is not entry token')
  ) {
    return {
      calls: [
        actions.common.swap({
          fromAsset: actualAssetToSwap,
          toAsset: depositToken,
          amount: amount,
          receiveAtLeast: swapArgs.receiveAtLeast,
          fee: swapArgs.fee,
          withData: swapArgs.calldata,
          collectFeeInFromToken: swapArgs.collectFeeInFromToken,
        }),
      ],
      isSwapNeeded,
    }
  } else {
    return { calls: [], isSwapNeeded }
  }
}

export async function deposit({
  entryToken,
  depositToken,
  amount,
  depositorAddress,
  swapArgs,
}: DepositArgs) {
  const isAssetEth = entryToken === ADDRESSES.main.ETH

  const tokenTransferCalls = isAssetEth
    ? [
        actions.common.wrapEth({
          amount,
        }),
      ]
    : [
        actions.common.pullToken({
          amount,
          asset: entryToken,
          from: depositorAddress,
        }),
      ]

  const { calls: swapCalls, isSwapNeeded } = getSwapCalls(
    depositToken,
    entryToken,
    amount,
    swapArgs,
    ADDRESSES.main.ETH,
    ADDRESSES.main.WETH,
  )

  return {
    calls: [
      ...tokenTransferCalls,
      ...swapCalls,
      actions.common.setApproval(
        {
          asset: depositToken || entryToken,
          delegate: ADDRESSES.main.aave.MainnetLendingPool,
          // Check the explanation about the deposit action.
          // This approval is about the amount that's going to be deposit in the following action
          amount,
          sumAmounts: false,
        },
        [0, 0, isSwapNeeded ? 1 : 0, 0],
      ),
      // If there is a 1 in the mapping for this param,
      // that means that the actual value that will be deposited
      // is amount that was received from the swap therefore no matter what is provided here
      // it will be ignored.
      // On other note, if mapping is 0, that means that no swap is required
      // therefore the actual deposited value will be used.
      actions.aave.aaveDeposit(
        {
          asset: depositToken || entryToken,
          amount,
          sumAmounts: false,
          setAsCollateral: false,
        },
        [0, isSwapNeeded ? 1 : 0, 0, 0],
      ),
    ],
    operationName: OPERATION_NAMES.common.CUSTOM_OPERATION,
  }
}
