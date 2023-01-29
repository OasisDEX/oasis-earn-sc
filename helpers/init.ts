import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Network } from '../scripts/common';

import { RuntimeConfig } from './types/common'

export default async function init(
  hre?: HardhatRuntimeEnvironment,
  impersonateAccount?: (
    provider: providers.JsonRpcProvider,
  ) => Promise<{ signer: providers.JsonRpcSigner; address: string }>,
): Promise<RuntimeConfig> {
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers
  const provider = ethers.provider
  let signer = provider.getSigner()
  let address = await signer.getAddress()

  if (impersonateAccount) {
    ;({ signer, address } = await impersonateAccount(provider))
  }

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
  forkedNetwork: Network = Network.MAINNET,
) {
  console.log(`    \x1b[90mResetting fork to block number: ${blockNumber}\x1b[0m`)
  await provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: getNetworkRpcUrl(forkedNetwork),
        blockNumber,
      },
    },
  ])
}

export async function resetNodeToLatestBlock(provider: providers.JsonRpcProvider, forkedNetwork: Network) {
  await provider.send('hardhat_reset', [
    {
      forking: {
        jsonRpcUrl: getNetworkRpcUrl(forkedNetwork),
      },
    },
  ])
}

export async function getForkedNetworkName(provider: providers.JsonRpcProvider) {
  const metadata = await provider.send('hardhat_metadata', [])  
  return metadata.forkedNetwork.chainId
}

export function getNetworkRpcUrl(network: Network) {
  if (network === Network.MAINNET) {
    return process.env.MAINNET_URL
  }
  if (network === Network.GOERLI) {
    return process.env.ALCHEMY_NODE_GOERLI
  }
}