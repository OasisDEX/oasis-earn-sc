import { AjnaError, MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'

export function validateLiquidity(
  position: MorphoBluePosition,
  targetPosition: MorphoBluePosition,
  borrowAmount: BigNumber,
  reallocatableLiquidityAssets: BigNumber,
): AjnaError[] {
  console.log(`position: ${JSON.stringify(position)}`)
  const liquidity = reallocatableLiquidityAssets
    .plus(position.market.totalSupplyAssets)
    .minus(position.market.totalBorrowAssets)
  const isIncreasingRisk = position.riskRatio.loanToValue.lte(targetPosition.riskRatio.loanToValue)

  console.log(`liquidity: ${liquidity.toString()}`)
  console.log(`borrowAmount: ${borrowAmount.toString()}`)
  console.log(`isIncreasingRisk: ${isIncreasingRisk}`)
  if (liquidity.lt(borrowAmount) && isIncreasingRisk) {
    return [
      {
        name: 'not-enough-liquidity',
        data: {
          amount: liquidity.toString(),
        },
      },
    ]
  }

  return []
}
