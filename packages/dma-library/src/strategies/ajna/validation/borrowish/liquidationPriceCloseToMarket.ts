import { AjnaPosition, AjnaWarning } from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'

export function validateLiquidationPriceCloseToMarketPrice(position: AjnaPosition): AjnaWarning[] {
  // check if liquidation is higher or equal to 0.97 * market price (3% offset)
  if (position.liquidationPrice.gte(new BigNumber(0.97).times(position.marketPrice))) {
    return [
      {
        name: 'liquidation-price-close-to-market-price',
      },
    ]
  } else {
    return []
  }
}
