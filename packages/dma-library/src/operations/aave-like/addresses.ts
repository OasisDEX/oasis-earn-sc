import { Address } from '@deploy-configurations/types/address'
import { Tokens } from '@deploy-configurations/types/deployment-config'

type RequiredTokens = 'WETH' | 'DAI' | 'ETH' | 'USDC'
type OptionalTokens = Exclude<Tokens, RequiredTokens>

export type TokenAddresses = {
  [K in RequiredTokens]: Address
} & Partial<Record<OptionalTokens, Address>>

export interface AaveLikeStrategyAddresses {
  tokens: TokenAddresses
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  oracle: string
  lendingPool: string
  poolDataProvider: string
}
