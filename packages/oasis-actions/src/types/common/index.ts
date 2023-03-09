export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

export type AjnaErrorUndercollateralized = {
  name: 'undercollateralized'
  data: {
    positionRatio: string
    minRatio: string
  }
}

export type AjnaErrorPaybackAboveDebt = {
  name: 'payback-above-debt'
}

export type AjnaError = AjnaErrorUndercollateralized | AjnaErrorPaybackAboveDebt

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
