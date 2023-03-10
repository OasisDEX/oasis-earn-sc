export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

export type AjnaMessage = {
  name: string
  data: {
    [key: string]: string
  }
}

export type AjnaError = AjnaMessage
export type AjnaWarning = AjnaMessage

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
