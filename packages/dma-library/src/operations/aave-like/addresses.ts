import { Address, Tokens } from '@oasisdex/deploy-configurations/types'

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
