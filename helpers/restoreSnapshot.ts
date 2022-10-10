import { providers } from 'ethers'

import { DeployedSystemInfo, deploySystem } from '../test/deploySystem'
import { resetNode } from './init'
import { ServiceRegistry } from './serviceRegistry'
import { RuntimeConfig } from './types/common'

type System = { system: DeployedSystemInfo; registry: ServiceRegistry }
type Snapshot = { id: string; deployed: System }

// Cached values
const snapshotCache: Record<string, Snapshot | undefined> = {}
const testBlockNumber = Number(process.env.TESTS_BLOCK_NUMBER)

export async function restoreSnapshot(
  config: RuntimeConfig,
  provider: providers.JsonRpcProvider,
  blockNumber: number = testBlockNumber,
  useFallbackSwap = true,
  debug = false,
): Promise<Snapshot> {
  const cacheKey = `${blockNumber}|${useFallbackSwap}`
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

    return snapshot
  } else {
    await resetNode(provider, blockNumber)

    const system = await deploySystem(config, true, useFallbackSwap)
    const snapshotId = await provider.send('evm_snapshot', [])

    const snapshot = {
      id: snapshotId,
      deployed: system,
    }

    snapshotCache[cacheKey] = snapshot

    return snapshot
  }
}
