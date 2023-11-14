import { getAaveDepositV3OperationDefinition } from '@deploy-configurations/operation-definitions'
import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import {
  AaveLikeStrategyAddresses,
  DepositArgs,
  DepositSwapArgs,
} from '@dma-library/operations/aave-like'
import { ActionCall, IOperation } from '@dma-library/types'
import { ActionPathDefinition } from '@dma-library/types/operations-definition'
import { isDefined } from '@dma-library/utils/is-defined'
import BigNumber from 'bignumber.js'

export type AaveV3DepositOperation = (
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

export const deposit: AaveV3DepositOperation = async (
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
      actions.aave.v3.aaveV3Deposit(
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
    operationName: getAaveDepositV3OperationDefinition(network).name,
  }
}

// Operation definition
export const deposit_definition: ActionPathDefinition[] = [
  {
    serviceNamePath: 'common.WRAP_ETH',
    optional: true,
  },
  {
    serviceNamePath: 'common.PULL_TOKEN',
    optional: true,
  },
  {
    serviceNamePath: 'common.SWAP_ACTION',
    optional: true,
  },
  {
    serviceNamePath: 'common.SET_APPROVAL',
    optional: false,
  },
  {
    serviceNamePath: 'aave.v3.DEPOSIT',
    optional: false,
  },
]
