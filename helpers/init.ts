import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { RuntimeConfig } from './types/common'

export async function impersonate(
  provider: providers.JsonRpcProvider,
  impersonatedAddress: string,
) {
  await provider.send('hardhat_impersonateAccount', [impersonatedAddress])

  const signer = provider.getSigner(impersonatedAddress)
  const address = await signer.getAddress()

  return { signer, address }
}

export async function impersonateRichAccount(provider: providers.JsonRpcProvider) {
  // https://etherscan.io/address/0xe3dd3914ab28bb552d41b8dfe607355de4c37a51
  const richAccount = '0xe3dd3914ab28bb552d41b8dfe607355de4c37a51'

  return await impersonate(provider, richAccount)
}

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
