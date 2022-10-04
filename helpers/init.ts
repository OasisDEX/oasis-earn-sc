import { ethers, providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from './types/common'

export default async function init(hre?: HardhatRuntimeEnvironment): Promise<RuntimeConfig> {
  const provider = hre ? hre.ethers.provider : (await import('hardhat')).ethers.provider
  // const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545', 2137)
  const signer = provider.getSigner(0)
  const address = await signer.getAddress()

  return {
    provider,
    signer,
    address,
  }
}

const testBlockNumber = Number(process.env.TESTS_BLOCK_NUMBER)
export async function resetNode(
  provider: providers.JsonRpcProvider,
  blockNumber: number = testBlockNumber,
) {
  console.log(`    \x1b[90mResetting fork to block number: ${blockNumber}\x1b[0m`)
  await provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.MAINNET_URL,
        blockNumber,
      },
    },
  ])
}

export async function resetNodeToLatestBlock(provider: providers.JsonRpcProvider) {
  await provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.MAINNET_URL,
      },
    },
  ])
}
