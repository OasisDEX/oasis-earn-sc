import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from './types/common'

// https://etherscan.io/address/0xe3dd3914ab28bb552d41b8dfe607355de4c37a51
const accountToImpersonate = '0xe3dd3914ab28bb552d41b8dfe607355de4c37a51'

export async function impersonateRichAccount(provider: providers.JsonRpcProvider) {
  await provider.send('hardhat_impersonateAccount', [accountToImpersonate])

  const signer = provider.getSigner(accountToImpersonate)
  const address = await signer.getAddress()

  return { signer, address }
}

export default async function init(hre?: HardhatRuntimeEnvironment): Promise<RuntimeConfig> {
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  const provider = ethers.provider

  const { signer, address } = await impersonateRichAccount(provider)

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
