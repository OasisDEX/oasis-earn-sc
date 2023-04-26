import { Address } from '@oasisdex/dma-deployments/types/address'
import BigNumber from 'bignumber.js'

export type Tx = {
  to: Address
  data: string
  value: string
}

export type Undercollateralized = {
  name: 'undercollateralized'
  data: {
    positionRatio: string
    minRatio: string
  }
}

export type AjnaError = Undercollateralized

type Delta = { debt: BigNumber; collateral: BigNumber; flashloanAmount: BigNumber }

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors: AjnaError[]
    delta?: Delta
  }
  tx: Tx
}

export enum FlashloanProvider {
  DssFlash = 0,
  Balancer = 1,
}
