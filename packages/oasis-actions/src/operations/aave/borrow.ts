import BigNumber from 'bignumber.js'

import { aaveDeposit } from '../../actions/aave'
import { pullToken, setApproval, swap, wrapEth } from '../../actions/common'
import { ADDRESSES } from '../../helpers/addresses'
import { OPERATION_NAMES } from '../../helpers/constants'

interface BorrowArgs {
  borrowToken: string
  amount: BigNumber
}
export async function borrow({ borrowToken, amount }: BorrowArgs) {
  const isAssetEth = borrowToken === ADDRESSES.main.ETH

  return {
    calls: [],
    operationName: OPERATION_NAMES.common.CUSTOM_OPERATION,
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
