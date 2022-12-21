import BigNumber from 'bignumber.js'

import * as actions from '../../actions'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES, ZERO } from '../../helpers/constants'
import { isDefined } from '../../helpers/isDefined'
import { Address } from '../../strategies/types/IPositionRepository'

interface SwapArgs {
  fee: number
  receiveAtLeast: BigNumber
  calldata: string
  collectFeeInFromToken: boolean
}

export interface DepositArgs {
  // - either for a swap where the `entryToken` will be exchanged for the `depositToken`
  // - or it will be directly deposited in the protocol
  entryTokenAddress: Address
  entryTokenIsEth: boolean
  // - either used for a swap if `entryToken` is swapped for `depositToken`
  // - or it will be directly deposited in the protocol
  amount: BigNumber
  depositToken: Address
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: Address
  swapArgs?: SwapArgs
}

export function getIsSwapNeeded(
  entryTokenAddress: Address,
  depositTokenAddress: Address,
  ETH: Address,
  WETH: Address,
) {
  const sameTokens = depositTokenAddress.toLowerCase() === entryTokenAddress.toLowerCase()
  const ethToWeth =
    entryTokenAddress.toLowerCase() === ETH.toLowerCase() &&
    depositTokenAddress.toLowerCase() === WETH.toLowerCase()

  return !(sameTokens || ethToWeth)
}

function getSwapCalls(
  depositTokenAddress: Address,
  entryTokenAddress: Address,
  amount: BigNumber,
  swapArgs: SwapArgs | undefined,
  ETH: string,
  WETH: string,
) {
  const isSwapNeeded = getIsSwapNeeded(entryTokenAddress, depositTokenAddress, ETH, WETH)
  const actualAssetToSwap = entryTokenAddress != ETH ? entryTokenAddress : WETH

  if (
    isSwapNeeded &&
    isDefined(swapArgs, 'Swap arguments are needed when deposit token is not entry token')
  ) {
    return {
      calls: [
        actions.common.swap({
          fromAsset: actualAssetToSwap,
          toAsset: depositTokenAddress,
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
    const skippedCall = actions.common.swap({
      fromAsset: entryTokenAddress,
      toAsset: depositTokenAddress,
      amount: ZERO,
      receiveAtLeast: ZERO,
      fee: 0,
      withData: 0,
      collectFeeInFromToken: true,
    })
    skippedCall.skipped = true
    return { calls: [skippedCall], isSwapNeeded }
  }
}

export async function deposit({
  entryTokenAddress,
  entryTokenIsEth,
  depositToken,
  amount,
  depositorAddress,
  swapArgs,
}: DepositArgs) {
  const isAssetEth = entryTokenIsEth

  const tokenTransferCalls = [
    actions.common.wrapEth({
      amount,
    }),
    actions.common.pullToken({
      amount,
      asset: entryTokenAddress,
      from: depositorAddress,
    }),
  ]

  if (isAssetEth) {
    //Asset IS eth
    tokenTransferCalls[1].skipped = true
  } else {
    //Asset is NOT eth
    tokenTransferCalls[0].skipped = true
  }

  const { calls: swapCalls, isSwapNeeded } = getSwapCalls(
    depositToken,
    entryTokenAddress,
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
          asset: depositToken,
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
          asset: depositToken,
          amount,
          sumAmounts: false,
          setAsCollateral: true,
        },
        [0, isSwapNeeded ? 1 : 0, 0, 0],
      ),
    ],
    operationName: OPERATION_NAMES.aave.DEPOSIT,
  }
}
