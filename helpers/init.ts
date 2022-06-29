import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from './types/common'

export default async function init(hre?: HardhatRuntimeEnvironment): Promise<RuntimeConfig> {
  const provider = hre ? hre.ethers.provider : (await import('hardhat')).ethers.provider

  const signer = provider.getSigner(0)
  const address = await signer.getAddress()

  return {
    provider,
    signer,
    address,
  }
}

export async function resetNode(provider: providers.JsonRpcProvider, blockNumber: number) {
  await provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.MAINNET_URL,
        blockNumber,
      },
    },
  ])
}
