import { Address, Swap, Tx } from '@dma-common/types'
import { ethers } from 'ethers'
export type { Erc4626StrategyAddresses } from './erc4626-addresses'
export type {
  Erc4626CommonDependencies,
  Erc4626DepositPayload,
  Erc4626DepositStrategy,
  Erc4626WithdrawPayload,
  Erc4626WithdrawStrategy,
} from './erc4626-strategies'
export type { IErc4626Position } from './erc4626-view'
export { Erc4626Position, FeeType } from './erc4626-view'

export type Strategy<Position> = {
  simulation: {
    swaps: Swap[]
    /** @deprecated - use position */
    targetPosition: Position
    position: Position
  }
  tx: Tx
}

export interface CommonDependencies {
  provider: ethers.providers.Provider
}

export interface CommonDMADependencies extends CommonDependencies {
  operationExecutor: Address
}

export { GetSwapData } from './get-swap-data'

export enum FlashloanProvider {
  DssFlash = 0,
  Balancer = 1,
}
