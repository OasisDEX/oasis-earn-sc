import BigNumber from 'bignumber.js'

export interface CDPInfo {
  id: number
  ilk: string
  urn: string
}

export interface VaultInfo {
  coll: BigNumber
  debt: BigNumber
}

export type CdpData = {
  skipFL: boolean
  gemJoin: string
  cdpId: number
  ilk: string
  fundsReceiver: string
  borrowCollateral: string
  requiredDebt: string
  daiTopUp: string
  collTopUp: string
  withdrawDai: string
  withdrawCollateral: string
  methodName: string
}
