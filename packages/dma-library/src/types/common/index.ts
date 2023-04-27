import { Address } from '@dma-deployments/types/address'

export { Optional } from '@dma-common/types/optional'

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

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors: AjnaError[]
  }
  tx: Tx
}

export enum FlashloanProvider {
  DssFlash = 0,
  Balancer = 1,
}
