import { IRiskRatio, Swap } from '../../domain'

export type Address = string

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

export type Strategy<Position, Error = void> = {
  simulation: {
    swaps: Swap[]
    // @deprecated - use position
    targetPosition: Position
    position: Position
    errors?: Error[]
  }
  tx: Tx
}

export type WithMinRiskRatio = {
  minRiskRatio: IRiskRatio
}
