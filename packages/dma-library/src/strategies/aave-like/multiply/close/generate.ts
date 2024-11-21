import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { IOperation, SwapData } from '@dma-library/types'
import { getPositionDataAaveLike } from '@dma-library/utils/fee-service'
import {
  calculateInflatedTokenFee,
  calculatePostSwapFeeAmount,
  feeResolver,
} from '@dma-library/utils/swap'
import { Position } from '@domain'
import BigNumber from 'bignumber.js'

import {
  AaveLikeCloseDependencies,
  AaveLikeExpandedCloseArgs,
  CloseFlashloanArgs,
  ICloseStrategy,
} from './types'

export async function generate(
  swapData: SwapData,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  preSwapFee: BigNumber,
  operation: IOperation,
  args: AaveLikeExpandedCloseArgs,
  flashloanArgs: CloseFlashloanArgs,
  dependencies: AaveLikeCloseDependencies,
): Promise<ICloseStrategy> {
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

  const fee = await feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    positionData: getPositionDataAaveLike(dependencies),
  })

  const postSwapFee = calculatePostSwapFeeAmount(
    collectFeeFrom,
    swapData.toTokenAmount,
    fee.feeToCharge,
    fee.feeType,
  )

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.negated(),
        collateral: currentPosition.collateral.amount.negated(),
      },
      swap: {
        ...swapData,
        tokenFee: calculateInflatedTokenFee({ postSwapFee, preSwapFee }),
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
    },
    flashloan: {
      amount: flashloanArgs.token.amount,
      token: {
        symbol: flashloanArgs.token.symbol,
        precision: flashloanArgs.token.precision ?? TYPICAL_PRECISION,
      },
    },
  }
}
