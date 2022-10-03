import { providers } from 'ethers'

import { DeployedSystemInfo, deploySystem } from '../test/deploySystem'
import { resetNode } from './init'
import { RuntimeConfig } from './types/common'

const snapshotCache: Record<string, { id: string; system: DeployedSystemInfo } | undefined> = {}
const testBlockNumber = Number(process.env.TESTS_BLOCK_NUMBER)

export async function restoreSnapshot(
  config: RuntimeConfig,
  provider: providers.JsonRpcProvider,
  blockNumber: number = testBlockNumber,
  useFallbackSwap = true,
): Promise<DeployedSystemInfo> {
  const cacheKey = `${blockNumber}|${useFallbackSwap}`
  const snapshot = snapshotCache[cacheKey]

  if (typeof snapshot !== 'undefined') {
    await provider.send('evm_revert', [snapshot.id])
    return snapshot.system
  } else {
    await resetNode(provider, blockNumber)
    const { system } = await deploySystem(config, false, useFallbackSwap)

    snapshotCache[cacheKey] = {
      id: await provider.send('evm_snapshot', []),
      system,
    }

    return system
  }
}
