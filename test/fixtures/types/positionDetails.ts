import { AavePosition } from '@oasisdex/oasis-actions'

export type AavePositionStrategy =
  | 'STETH/ETH Earn'
  | 'WBTC/USDC Multiply'
  | 'ETH/USDC Multiply'
  | 'STETH/USDC Multiply'

export type PositionDetails = {
  getPosition: () => Promise<AavePosition>
  proxy: string
  strategy: AavePositionStrategy
}
