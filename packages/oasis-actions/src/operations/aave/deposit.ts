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
  // - either for a swap where the `entryToken` will be exchanged for the `depositToken`
  // - or it will be directly deposited in the protocol
  entryToken: string
  // - either used for a swap if `entryToken` is swapped for `depositToken`
  // - or it will be directly deposited in the protocol
  amount: BigNumber
  // - if it's omitted that means that the `entryToken` with bbe used in the deposit
  // - if it's provided that means that the `entryToken` will be swapped for `depositToken`
  depositToken?: string
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: string
  // In order to borrow assets on aave the deposited ones ( lent ) should be allowed to be used as collateral.
  allowDepositTokenAsCollateral: boolean
  // Must be provided if `depositToken` is also provided
  swapArgs?: SwapArgs
}
export async function deposit({
  entryToken,
  depositToken,
  amount,
  depositorAddress,
  swapArgs,
}: DepositArgs) {
  const isSwapNeeded = !!depositToken
  const isAssetEth = entryToken === ADDRESSES.main.ETH
  const actualAssetToSwap = entryToken != ADDRESSES.main.ETH ? entryToken : ADDRESSES.main.WETH

  if (isSwapNeeded) assert(swapArgs, 'Provide Swap Args')

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
              asset: entryToken,
              from: depositorAddress,
            }),
          ]),
      ...(isSwapNeeded
        ? [
            swap({
              fromAsset: actualAssetToSwap,
              toAsset: depositToken,
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
      aaveDeposit(
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
