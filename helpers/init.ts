import '@nomiclabs/hardhat-ethers'

import { providers } from 'ethers'
import { ethers } from 'hardhat'

import { RuntimeConfig } from './types/common'

export default async function init(): Promise<RuntimeConfig> {
  console.log('Using standalone node:', process.env.USE_STANDALONE_NODE === `1`)
  const provider =
    process.env.USE_STANDALONE_NODE === `1`
      ? new ethers.providers.JsonRpcProvider()
      : ethers.provider

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
