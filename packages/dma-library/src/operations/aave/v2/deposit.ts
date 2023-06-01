import { aaveDepositV2OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { DepositArgs } from '@dma-library/operations/aave/common'
import { DepositSwapArgs } from '@dma-library/operations/aave/common/deposit-args'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { ActionCall, IOperation } from '@dma-library/types'
import { isDefined } from '@dma-library/utils/is-defined'
import BigNumber from 'bignumber.js'

export type AaveV2DepositOperation = (
  args: DepositArgs,
  addresses: AAVEStrategyAddresses,
) => Promise<IOperation>

function getSwapCalls(
  depositTokenAddress: Address,
  entryTokenAddress: Address,
  amountInBaseUnit: BigNumber,
  swapArgs: DepositSwapArgs | undefined,
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

export const deposit: AaveV2DepositOperation = async (
  {
    entryTokenAddress,
    entryTokenIsEth,
    depositToken,
    amountInBaseUnit,
    depositorAddress,
    swapArgs,
    isSwapNeeded,
  },
  addresses,
) => {
  const isAssetEth = entryTokenIsEth

  // Import ActionCall as it assists type generation
  const tokenTransferCalls: ActionCall[] = [
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
    addresses.ETH,
    addresses.WETH,
    isSwapNeeded,
  )

  return {
    calls: [
      ...tokenTransferCalls,
      ...swapCalls,
      actions.common.setApproval(
        {
          asset: depositToken,
          delegate: addresses.lendingPool,
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
    operationName: aaveDepositV2OperationDefinition.name,
  }
}
