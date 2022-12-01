import BigNumber from 'bignumber.js'
import { assert } from 'console'
import { aaveDeposit } from '../../actions/aave'
import { wrapEth, pullToken, swap, setApproval } from '../../actions/common'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES } from '../../helpers/constants'

interface SwapArgs {
  fee: number
  receiveAtLeast: BigNumber
  calldata: string
  collectFeeInFromToken: boolean
}

// TODO: Probably put a generic about the tokens i.e DepositArgs<Tokens> and provide AAVETokens
// TODO: Take into consideration the precision for the tokens. So indeed might be a good idea for the Tokens generics
interface DepositArgs {
  // - either for a swap where the `entryTokenAddress` will be exchanged for the `depositTokenAddress`
  // - or it will be directly deposited in the protocol
  entryTokenAddress: string
  // - either used for a swap if `entryTokenAddress` is swapped for `depositTokenAddress`
  // - or it will be directly deposited in the protocol
  amount: BigNumber
  // - if it's omitted that means that the `entryTokenAddress` will be used in the deposit
  // - if it's provided that means that the `entryTokenAddress` will be swapped for `depositTokenAddress`
  depositTokenAddress?: string
  // - User might want to deposit the entry token so there won't be any need of a swap.
  isSwapNeeded?: boolean
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: string
  // In order to borrow assets on aave the deposited ones ( lent ) should be allowed to be used as collateral.
  allowDepositTokenAsCollateral: boolean
  // Must be provided if `depositTokenAddress` is also provided
  swapArgs?: SwapArgs
}
export async function deposit({
  entryTokenAddress,
  depositTokenAddress,
  isSwapNeeded = true,
  amount,
  depositorAddress,
  swapArgs,
}: DepositArgs) {
  const isAssetEth = entryTokenAddress === ADDRESSES.main.ETH
  const actualAssetToSwap =
    entryTokenAddress != ADDRESSES.main.ETH ? entryTokenAddress : ADDRESSES.main.WETH

  if (isSwapNeeded) {
    assert(depositTokenAddress, 'Provide a Deposit token')
    assert(swapArgs, 'Provide Swap Args')
  }

  return {
    calls: [
      ...(isAssetEth
        ? [
            wrapEth({
              amount,
            }),
          ]
        : [
            pullToken({
              amount,
              asset: entryTokenAddress,
              from: depositorAddress,
            }),
          ]),
      ...(isSwapNeeded
        ? [
            swap({
              fromAsset: actualAssetToSwap,
              toAsset: depositTokenAddress!,
              amount: amount,
              receiveAtLeast: swapArgs?.receiveAtLeast!,
              fee: swapArgs?.fee!,
              withData: swapArgs?.calldata!,
              collectFeeInFromToken: swapArgs?.collectFeeInFromToken!,
            }),
          ]
        : []),
      setApproval(
        {
          asset: depositTokenAddress || entryTokenAddress,
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
      aaveDeposit(
        {
          asset: depositTokenAddress || entryTokenAddress,
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
