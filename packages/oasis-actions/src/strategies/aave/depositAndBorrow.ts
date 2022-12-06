import BigNumber from 'bignumber.js'

import { ONE, TEN_THOUSAND, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { BorrowArgs } from '../../operations/aave/borrow'
import { DepositArgs } from '../../operations/aave/deposit'
import { AAVETokens } from '../../operations/aave/tokens'
import {
  IPositionTransitionDependencies,
} from '../types/IPositionRepository'
import { IPositionTransitionWithOptionalSwap } from '../types/IPositionTransition'

export async function depositBorrow(
  {
    
  }: IPositionTransitionWithOptionalSwap,
  depositArgs: Omit<DepositArgs, 'swapArgs'>,
  borrowArgs: BorrowArgs,
  {
    user,
    currentPosition,
    getSwapData,
    addresses,
  }: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransitionWithOptionalSwap> {
  // TODO: Read from some more global place or just passed as an argument
  const FEE = 20
  const FEE_BASE = TEN_THOUSAND

  let collateralDelta = ZERO
  let debtDelta = ZERO

  if (depositArgs) {
    const isSwapNeeded = depositArgs.depositToken !== depositArgs.entryToken

    if (isSwapNeeded) {
      const swapData = await getSwapData(
        addresses[entryToken.symbol === 'ETH' ? 'WETH' : entryToken.symbol],
        addresses[collateralToken.symbol],
        swapAmount,
        slippage,
      )
    } else {
      collateralDelta = depositArgs.amount
    }
  }



  let swapAmount = depositedByUser?.collateralInWei!
  const collectFeeInFromToken = collectSwapFeeFrom === 'sourceToken'

  if (collectFeeInFromToken) {
    swapAmount = swapAmount.times(ONE.minus(new BigNumber(FEE).div(FEE_BASE)))
  }

  const shouldUseSwap = entryToken.symbol !== collateralToken.symbol

  const swapData = shouldUseSwap
    ? await getSwapData(
        addresses[entryToken.symbol === 'ETH' ? 'WETH' : entryToken.symbol],
        addresses[collateralToken.symbol],
        swapAmount,
        slippage,
      )
    : undefined

  return {
    transaction: await operations.aave.deposit({
      entryToken: addresses[entryToken.symbol],
      depositToken: shouldUseSwap ? addresses[collateralToken.symbol] : undefined,
      amount: depositedByUser?.collateralInWei!,
      depositorAddress: user,
      allowDepositTokenAsCollateral: true,
      swapArgs: shouldUseSwap
        ? {
            fee: FEE,
            collectFeeInFromToken,
            receiveAtLeast: swapData?.minToTokenAmount!,
            calldata: swapData?.exchangeCalldata! as string,
          }
        : undefined,
    }),
    simulation: {
      position: currentPosition,
      delta: {
        debt: currentPosition.debt.amount,
        collateral: currentPosition.collateral.amount.plus(swapData?.minToTokenAmount!),
        flashloanAmount: ZERO,
      },
      swap: shouldUseSwap
        ? {
            ...swapData!,
            tokenFee: new BigNumber(FEE),
            collectFeeFrom: 'sourceToken',
            sourceToken: {
              symbol: entryToken.symbol,
              precision: entryToken.precision!,
            },
            targetToken: {
              symbol: collateralToken.symbol,
              precision: collateralToken.precision!,
            },
          }
        : undefined,
      flags: { requiresFlashloan: false, isIncreasingRisk: false },
      minConfigurableRiskRatio: currentPosition.minConfigurableRiskRatio(ZERO),
    },
  }
}
