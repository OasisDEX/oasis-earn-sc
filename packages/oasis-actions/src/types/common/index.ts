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
