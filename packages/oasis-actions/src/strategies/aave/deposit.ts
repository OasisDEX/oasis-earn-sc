import BigNumber from 'bignumber.js'
import { Optional } from 'utility-types'
import { ONE, TEN_THOUSAND, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens, TokenDef } from '../../operations/aave/tokens'
import {
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  WithDeposit,
  WithDifferentEntryToken,
} from '../types/IPositionRepository'
import { IPositionTransitionWithOptionalSwap } from '../types/IPositionTransition'

type Deposit = Optional<
  Omit<IBasePositionTransitionArgs<AAVETokens>, 'debtToken'>,
  'collateralToken'
> &
  WithDeposit &
  WithDifferentEntryToken<AAVETokens>

export async function deposit(
  { entryToken, collateralToken, slippage, collectSwapFeeFrom, depositedByUser }: Deposit,
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

  let swapAmount = depositedByUser?.collateralInWei!
  const collectFeeInFromToken = collectSwapFeeFrom === 'sourceToken'

  if (collectFeeInFromToken) {
    swapAmount = swapAmount.times(ONE.minus(new BigNumber(FEE).div(FEE_BASE)))
  }

  const shouldUseSwap = !!collateralToken

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
      entryTokenAddress: addresses[entryToken.symbol],
      depositTokenAddress: shouldUseSwap ? addresses[collateralToken.symbol] : undefined,
      isSwapNeeded: shouldUseSwap,
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
            collectFeeFrom: collectSwapFeeFrom!,
            sourceToken: entryToken,
            targetToken: collateralToken,
          }
        : undefined,
      flags: { requiresFlashloan: false, isIncreasingRisk: false },
      minConfigurableRiskRatio: currentPosition.minConfigurableRiskRatio(ZERO),
    },
  }
}
