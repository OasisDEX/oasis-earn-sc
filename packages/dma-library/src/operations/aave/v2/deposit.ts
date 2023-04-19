import * as actions from '@dma-library/actions'
import { isDefined } from '@dma-library/utils/is-defined'
import { ADDRESSES } from '@oasisdex/addresses'
import { OPERATION_NAMES, ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'

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
  amountInBaseUnit: BigNumber
  depositToken: Address
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: Address
  isSwapNeeded: boolean
  swapArgs?: SwapArgs
}

function getSwapCalls(
  depositTokenAddress: Address,
  entryTokenAddress: Address,
  amountInBaseUnit: BigNumber,
  swapArgs: SwapArgs | undefined,
  ETHAddress: Address,
  WETHAddress: Address,
  isSwapNeeded: boolean,
) {
  const actualAssetToSwap = entryTokenAddress != ETHAddress ? entryTokenAddress : WETHAddress

  if (
    isSwapNeeded &&
    isDefined(swapArgs, 'Swap arguments are needed when deposit token is not entry token')
  ) {
    return [
      actions.common.swap({
        fromAsset: actualAssetToSwap,
        toAsset: depositTokenAddress,
        amount: amountInBaseUnit,
        receiveAtLeast: swapArgs.receiveAtLeast,
        fee: swapArgs.fee,
        withData: swapArgs.calldata,
        collectFeeInFromToken: swapArgs.collectFeeInFromToken,
      }),
    ]
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

    return [skippedCall]
  }
}

export async function deposit({
  entryTokenAddress,
  entryTokenIsEth,
  depositToken,
  amountInBaseUnit,
  depositorAddress,
  swapArgs,
  isSwapNeeded,
}: DepositArgs) {
  const isAssetEth = entryTokenIsEth

  const tokenTransferCalls = [
    actions.common.wrapEth({
      amount: amountInBaseUnit,
    }),
    actions.common.pullToken({
      amount: amountInBaseUnit,
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

  const swapCalls = getSwapCalls(
    depositToken,
    entryTokenAddress,
    amountInBaseUnit,
    swapArgs,
    ADDRESSES[Network.MAINNET].common.ETH,
    ADDRESSES[Network.MAINNET].common.WETH,
    isSwapNeeded,
  )

  return {
    calls: [
      ...tokenTransferCalls,
      ...swapCalls,
      actions.common.setApproval(
        {
          asset: depositToken,
          delegate: ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
          // Check the explanation about the deposit action.
          // This approval is about the amount that's going to be deposit in the following action
          amount: amountInBaseUnit,
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
      actions.aave.v2.aaveDeposit(
        {
          asset: depositToken,
          amount: amountInBaseUnit,
          sumAmounts: false,
          setAsCollateral: true,
        },
        [0, isSwapNeeded ? 1 : 0, 0, 0],
      ),
    ],
    operationName: OPERATION_NAMES.aave.v2.DEPOSIT,
  }
}
