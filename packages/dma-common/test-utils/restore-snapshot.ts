import { resetNode } from '@dma-common/utils/init'
import { ServiceRegistry } from '@oasisdex/dma-deployments/utils/wrappers'
import { providers } from 'ethers'

import { RuntimeConfig } from '../types/common'
import { DeployedSystemInfo, deploySystem } from './deploy-system'

type System = { system: DeployedSystemInfo; registry: ServiceRegistry }
export type Snapshot = { id: string; deployed: System }

// Cached values
const snapshotCache: Record<string, Snapshot | undefined> = {}
const testBlockNumber = Number(process.env.TESTS_BLOCK_NUMBER)

export async function restoreSnapshot(args: {
  config: RuntimeConfig
  provider: providers.JsonRpcProvider
  blockNumber: number
  useFallbackSwap?: boolean
  debug?: boolean
}): Promise<{ snapshot: Snapshot; config: RuntimeConfig }> {
  const { config, provider, blockNumber, useFallbackSwap, debug } = args

  const _blockNumber = blockNumber || testBlockNumber

  const cacheKey = `${_blockNumber}|${useFallbackSwap}`
  const snapshot = snapshotCache[cacheKey]

  let revertSuccessful = false
  if (typeof snapshot !== 'undefined') {
    revertSuccessful = await provider.send('evm_revert', [snapshot.id])
  }

  if (typeof snapshot !== 'undefined' && revertSuccessful) {
    const nextSnapshotId = await provider.send('evm_snapshot', [])

    if (debug) {
      console.log('Reverting with snapshot id :', snapshot.id)
      console.log('Revert successful:', revertSuccessful)
      console.log('Blocknumber:', await provider.getBlockNumber())
      console.log('Next snapshot id after revert', nextSnapshotId)
    }

    snapshot.id = nextSnapshotId
    snapshotCache[cacheKey] = snapshot

    return { snapshot, config }
  } else {
    if (debug) {
      console.log('resetting node to:', _blockNumber)
      console.log('deploying system again')
    }
    await resetNode(provider, _blockNumber)

    const system = await deploySystem(config, debug, useFallbackSwap)
    const snapshotId = await provider.send('evm_snapshot', [])

    const snapshot = {
      id: snapshotId,
      deployed: system,
    }

    snapshotCache[cacheKey] = snapshot

    return { snapshot, config: config }
  }
}
