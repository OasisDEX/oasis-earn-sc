import '@nomiclabs/hardhat-ethers'

import { providers } from 'ethers'
import { ethers } from 'hardhat'

import { RuntimeConfig } from '../helpers/types'

export default async function init(): Promise<RuntimeConfig> {
  const provider = new ethers.providers.JsonRpcProvider()
  const signer = provider.getSigner(0)
  const address = await signer.getAddress()

  return {
    provider,
    signer,
    address,
  }
}

export async function resetNode(provider: providers.JsonRpcProvider, blockNumber: number) {
  provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.MAINNET_URL,
        blockNumber,
      },
    },
  ])
}
