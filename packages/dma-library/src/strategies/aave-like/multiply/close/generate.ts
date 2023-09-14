import { FEE_ESTIMATE_INFLATOR, ONE, TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { amountFromWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { IOperation, SwapData } from '@dma-library/types'
import { feeResolver } from '@dma-library/utils/swap'
import { Position } from '@domain'
import BigNumber from 'bignumber.js'

import { AaveLikeCloseDependencies, AaveLikeExpandedCloseArgs, CloseFlashloanArgs } from './types'

export async function generate(
  swapData: SwapData,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  preSwapFee: BigNumber,
  operation: IOperation,
  args: AaveLikeExpandedCloseArgs,
  flashloanArgs: CloseFlashloanArgs,
  dependencies: AaveLikeCloseDependencies,
) {
  const currentPosition = dependencies.currentPosition

  const {
    protocolData: {
      collateralTokenPriceInEth: collateralTokenPrice,
      debtTokenPriceInEth: debtTokenPrice,
    },
  } = args

  if (!collateralTokenPrice || !debtTokenPrice) {
    throw new Error('Missing protocol data')
  }

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const oracle = collateralTokenPrice.div(debtTokenPrice)
  const finalPosition = new Position(
    { amount: ZERO, symbol: currentPosition.debt.symbol },
    { amount: ZERO, symbol: currentPosition.collateral.symbol },
    oracle,
    currentPosition.category,
  )

  const flags = { requiresFlashloan: true, isIncreasingRisk: false }

  // We need to estimate the fee due when collecting from the target token
  // We use the toTokenAmount given it's the most optimistic swap scenario
  // Meaning it corresponds with the largest fee a user can expect to pay
  // Thus, if the swap performs poorly the fee will be less than expected
  const fromTokenAmountNormalised = amountFromWei(
    swapData.fromTokenAmount,
    args.collateralToken.precision,
  )
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    args.debtToken.precision,
  )

  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)

  const postSwapFee =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.negated(),
        collateral: currentPosition.collateral.amount.negated(),
        flashloanAmount: simulatedPositionTransition.delta.flashloanAmount,
      },
      flags: flags,
      swap: {
        ...swapData,
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
        collectFeeFrom,
        sourceToken: {
          symbol: args.collateralToken.symbol,
          precision: args.collateralToken.precision ?? TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: args.debtToken.symbol,
          precision: args.debtToken.precision ?? TYPICAL_PRECISION,
        },
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
    flashloan: {
      ...flashloanArgs,
    },
  }
}
