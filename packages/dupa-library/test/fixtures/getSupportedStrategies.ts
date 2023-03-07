import { AavePositionStrategy } from './types'

export function getSupportedStrategies(): AavePositionStrategy[] {
  return ['ETH/USDC Multiply', 'STETH/USDC Multiply', 'WBTC/USDC Multiply', 'STETH/ETH Earn']
}
