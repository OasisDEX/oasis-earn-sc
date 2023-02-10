export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

export type Strategy<Position> = {
  simulation: {
    swaps: []
    // @deprecated - use position
    targetPosition: Position
    position: Position
  }
  tx: Tx
}
