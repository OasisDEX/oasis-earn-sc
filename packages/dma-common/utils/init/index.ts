import { RuntimeConfig } from '@dma-common/types/common'
import { providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export default async function index(
  _hre?: HardhatRuntimeEnvironment,
  impersonateAccount?: (provider: providers.JsonRpcProvider) => Promise<{
    signer: providers.JsonRpcSigner
    address: string
  }>,
): Promise<RuntimeConfig & { hre: HardhatRuntimeEnvironment }> {
  const hre = _hre || (await import('hardhat'))
  const ethers = hre.ethers
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
    hre,
  }
}

export async function resetNode(
  provider: providers.JsonRpcProvider,
  blockNumber: number,
  showLogs = false,
) {
  showLogs && console.log(`    \x1b[90mResetting fork to block number: ${blockNumber}\x1b[0m`)
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
