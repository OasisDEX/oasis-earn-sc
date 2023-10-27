import { getMorphoBlueDepositOperationDefinition } from '@deploy-configurations/operation-definitions'
import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { NULL_ADDRESS, ZERO } from '@dma-common/constants'
import { actions } from '@dma-library/actions'
import { AaveLikeStrategyAddresses, DepositSwapArgs } from '@dma-library/operations/aave-like'
import { ActionCall, IOperation, MorphoBlueMarket } from '@dma-library/types'
import { isDefined } from '@dma-library/utils/is-defined'
import { getIsSwapNeeded, getSwapInputToken } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

export type MorphoBlueDepositArgs = {
  morphoBlueMarket: MorphoBlueMarket
  /** Address of the token that the user has made available for the operation */
  userFundsTokenAddress: Address
  /** Amount of user funds that will be used in the operation */
  userFundsTokenAmount: BigNumber
  /** Used to pull tokens from if ERC20 is used in the deposit */
  depositorAddress: Address
  /** The swap arguments are used if the `inputTokenAddress` is not the same as the `collateralToken` for the MorphoBlueMarket */
  swapArgs?: DepositSwapArgs
}

export type MorphoBlueDepositOperation = (
  args: MorphoBlueDepositArgs,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) => Promise<IOperation>

function getSwapCalls(
  userFundsTokenAddress: Address,
  userFundsTokenAmount: BigNumber,
  collateralTokenAddress: Address,
  swapArgs: DepositSwapArgs | undefined,
  addresses: AaveLikeStrategyAddresses,
  network: Network,
) {
   const isSwapNeeded = getIsSwapNeeded(userFundsTokenAddress, collateralTokenAddress, addresses.tokens.ETH, addresses.tokens.WETH)

  if (
    isSwapNeeded &&
    isDefined(swapArgs, 'Swap arguments are needed when deposit token is not entry token')
  ) {
  if (swapArgs) {
    const actualAssetToSwap = getSwapInputToken(userFundsTokenAddress, addresses.tokens.ETH, addresses.tokens.WETH)

    return [
      actions.common.swap(network, {
        fromAsset: actualAssetToSwap,
        toAsset: collateralTokenAddress,
        amount: userFundsTokenAmount,
        receiveAtLeast: swapArgs.receiveAtLeast,
        fee: swapArgs.fee,
        withData: swapArgs.calldata,
        collectFeeInFromToken: swapArgs.collectFeeInFromToken,
      }),
    ]
  } else {
    const skippedCall = actions.common.swap(network, {
      fromAsset: NULL_ADDRESS,
      toAsset: NULL_ADDRESS,
      amount: ZERO,
      receiveAtLeast: ZERO,
      fee: 0,
      withData: 0,
      collectFeeInFromToken: false,
    })
    skippedCall.skipped = true

    return [skippedCall]
  }
}

export const deposit: MorphoBlueDepositOperation = async (
  { morphoBlueMarket, depositorAddress, swapArgs },
  addresses,
  network,
) => {
  const isAssetEth = swapArgs ? swapArgs.fromTokenIsETH : false

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
      actions.morphoblue.deposit(
        network,
        {
          morphoBlueMarket: morphoBlueMarket,
          amount: amountInBaseUnit,
          sumAmounts: false,
        },
        [0, isSwapNeeded ? 1 : 0],
      ),
    ],
    operationName: getMorphoBlueDepositOperationDefinition(network).name,
  }
}
