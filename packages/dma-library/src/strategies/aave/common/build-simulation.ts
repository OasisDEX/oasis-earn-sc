import { IPosition } from '@domain'
import BigNumber from 'bignumber.js'

export function buildSimulation(
  debtDelta: BigNumber,
  collateralDelta: BigNumber,
  finalPosition: IPosition,
) {
  return {
    delta: {
      debt: debtDelta,
      collateral: collateralDelta,
    },
    position: finalPosition,
  }
}
