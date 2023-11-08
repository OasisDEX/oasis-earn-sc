import { Address } from '@deploy-configurations/types/address'
import { Tokens } from '@deploy-configurations/types/deployment-config'

type RequiredTokens = 'WETH' | 'DAI' | 'ETH' | 'USDC' | 'USDT' | 'WBTC' | 'WSTETH'
type OptionalTokens = Exclude<Tokens, RequiredTokens>

export type TokenAddresses = {
  [K in RequiredTokens]: Address
} & Partial<Record<OptionalTokens, Address>>

export interface MorphoBlueStrategyAddresses {
  morphoblue: Address
  operationExecutor: Address
  tokens: TokenAddresses
}
