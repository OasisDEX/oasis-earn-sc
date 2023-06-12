import { Address, Swap, Tx } from '@dma-common/types'
import { ethers } from 'ethers'

export type Strategy<Position> = {
  simulation: {
    swaps: Swap[]
    /** @deprecated - use position */
    targetPosition: Position
    position: Position
  }
  tx: Tx
}

export enum FlashloanProvider {
  DssFlash = 0,
  Balancer = 1,
}

export interface CommonDependencies {
  provider: ethers.providers.Provider
}

export interface CommonDMADependencies extends CommonDependencies {
  operationExecutor: Address
}
