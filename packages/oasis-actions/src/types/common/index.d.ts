import BigNumber from 'bignumber.js'

export type Address = string

export type Tx = {
  to: Address
  data: string
  value: string
}

interface AllowanceRequirement {
  kind: 'AllowanceRequirement'
  token: Address
  amount: BigNumber
}

interface DPMRequirement {
  kind: 'DPMRequirement'
  token: Address
  amount: BigNumber
}

export type Requirements = AllowanceRequirement | DPMRequirement

export type Strategy<Position> = {
  simulation: {
    swaps: []
    targetPosition: Position
  }
  //requirements: Requirements[]
  tx: Tx
}
