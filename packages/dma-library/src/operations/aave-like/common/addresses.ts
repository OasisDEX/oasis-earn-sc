import { Address } from '@deploy-configurations/types/address'
import { Tokens } from '@deploy-configurations/types/deployment-config'

export type TokenAddresses = Partial<Record<Tokens, Address>>

export interface AaveLikeStrategyAddresses {
  tokens: TokenAddresses & { WETH: Address; DAI: Address; ETH: Address; USDC: Address }
  operationExecutor: string
  chainlinkEthUsdPriceFeed: string
  oracle: string
  lendingPool: string
  poolDataProvider: string
}
