import { RuntimeConfig } from '@dma-common/types/common'
import { resetNode } from '@dma-common/utils/init'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { deployTestSystem, TestDeploymentSystem } from './deploy-test-system'

export type Snapshot = {
  id: string
  testSystem: TestDeploymentSystem
  config: RuntimeConfig
  extraDeployment?: any
}

// Cached values
const snapshotCache: Record<string, Snapshot | undefined> = {}
const testBlockNumber = Number(process.env.TESTS_BLOCK_NUMBER)

export async function restoreSnapshot(
  args: {
    hre: HardhatRuntimeEnvironment
    blockNumber: number
    useFallbackSwap?: boolean
    debug?: boolean
  },
  extraDeploymentCallback?: (snapshot: Snapshot, debug: boolean) => Promise<any>,
): Promise<{ snapshot: Snapshot }> {
  const { hre, blockNumber, useFallbackSwap } = args
  const debug = args.debug || false
  const provider = hre.ethers.provider

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

    return { snapshot }
  } else {
    if (debug) {
      console.log('resetting node to:', _blockNumber)
      console.log('deploying system again')
    }
    await resetNode(provider, _blockNumber, debug)

    const system = await deployTestSystem(hre, debug, useFallbackSwap)

    const config: RuntimeConfig = {
      provider: provider,
      signer: provider.getSigner(),
      address: await provider.getSigner().getAddress(),
    }

    const snapshot: Snapshot = {
      id: '',
      testSystem: system,
      config,
    }

    // This is useful to also capture the extra deployment in the snapshot
    let extraDeploymentResult = undefined
    if (extraDeploymentCallback) {
      extraDeploymentResult = await extraDeploymentCallback(snapshot, debug)
    }

    const snapshotId = await provider.send('evm_snapshot', [])
    snapshot.id = snapshotId
    snapshot.extraDeployment = extraDeploymentResult
    snapshotCache[cacheKey] = snapshot

    return { snapshot }
  }
}
