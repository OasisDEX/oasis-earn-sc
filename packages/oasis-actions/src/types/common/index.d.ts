export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

export type Strategy<Position> = {
  simulation: {
    swaps: []
    targetPosition: Position
  }
  tx: Tx
}
