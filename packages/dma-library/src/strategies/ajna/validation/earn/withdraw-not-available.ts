import { negativeToZero } from '@dma-common/utils/common'
import { protocols } from '@dma-library/protocols'
import { getPoolLiquidity } from '@dma-library/strategies/ajna/validation'
import { AjnaEarnPosition, AjnaError } from '@dma-library/types'

export const validateWithdrawNotAvailable = (
  position: AjnaEarnPosition,
  simulation: AjnaEarnPosition,
  quoteTokenPrecision: number,
): AjnaError[] => {
  const availableToWithdraw = negativeToZero(
    protocols.ajna
      .calculateAjnaMaxLiquidityWithdraw({
        pool: position.pool,
        poolCurrentLiquidity: getPoolLiquidity(position.pool),
        position,
        simulation,
      })
      .decimalPlaces(quoteTokenPrecision),
  )

  if (availableToWithdraw.isZero()) {
    return [
      {
        name: 'withdraw-not-available',
      },
    ]
  } else {
    return []
  }
}
