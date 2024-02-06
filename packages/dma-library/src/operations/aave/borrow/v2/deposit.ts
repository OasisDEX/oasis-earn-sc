import { getAaveDepositV2OperationDefinition } from '@oasisdex/deploy-configurations/operation-definitions'
import { Address, Network } from '@oasisdex/deploy-configurations/types'
import { ZERO } from '@oasisdex/dma-common/constants'
import BigNumber from 'bignumber.js'

import { actions } from '../../../../actions'
import { ActionCall, IOperation } from '../../../../types'
import { isDefined } from '../../../../utils/is-defined'
import { AaveLikeStrategyAddresses, DepositArgs, DepositSwapArgs } from '../../../aave-like'

export type AaveV2DepositOperation = (
  args: DepositArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

function getSwapCalls(
  depositTokenAddress: Address,
  entryTokenAddress: Address,
  amountInBaseUnit: BigNumber,
  swapArgs: DepositSwapArgs | undefined,
  ETHAddress: Address,
  WETHAddress: Address,
  isSwapNeeded: boolean,
  network: Network,
) {
  const actualAssetToSwap = entryTokenAddress != ETHAddress ? entryTokenAddress : WETHAddress

  if (
    isSwapNeeded &&
    isDefined(swapArgs, 'Swap arguments are needed when deposit token is not entry token')
  ) {
    return [
      actions.common.swap(network, {
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
    const skippedCall = actions.common.swap(network, {
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
  network,
) => {
  const isAssetEth = entryTokenIsEth

  // Import ActionCall as it assists type generation
  const tokenTransferCalls: ActionCall[] = [
    actions.common.wrapEth(network, {
      amount: amountInBaseUnit,
    }),
    actions.common.pullToken(network, {
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
    addresses.tokens.ETH,
    addresses.tokens.WETH,
    isSwapNeeded,
    network,
  )

  return {
    calls: [
      ...tokenTransferCalls,
      ...swapCalls,
      actions.common.setApproval(
        network,
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
        network,
        {
          asset: depositToken,
          amount: amountInBaseUnit,
          sumAmounts: false,
          setAsCollateral: true,
        },
        [0, isSwapNeeded ? 1 : 0, 0, 0],
      ),
    ],
    operationName: getAaveDepositV2OperationDefinition(network).name,
  }
}
