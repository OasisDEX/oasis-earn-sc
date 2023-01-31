import { BigNumber } from 'bignumber.js'

import { AjnaPosition } from '../../types/ajna'

function bucketIndexToPrice(index: number) {
  return new BigNumber(1.05).pow(index - 3232)
}

export async function getPosition(): Promise<AjnaPosition> {
  return {} as any as AjnaPosition
}
