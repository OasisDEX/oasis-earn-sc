import { providers } from 'ethers'

import { Network, NetworkByChainId } from '../../../../../helpers/network'
import { FlashloanProvider } from '../../types/common'

export const resolveFlashloanProvider = async (provider: providers.Provider) => {
  const chainId = (await provider.getNetwork()).chainId

  if (NetworkByChainId[chainId] === Network.LOCAL) {
    const localProvider = provider as providers.JsonRpcProvider
    if (!(localProvider as providers.JsonRpcProvider).send)
      throw new Error('Provider does not support send method')
    const metadata = await localProvider.send('hardhat_metadata', [])
    return resolveProvider(NetworkByChainId[metadata.forkedNetwork.chainId])
  }

  return resolveProvider(NetworkByChainId[chainId])
}

function resolveProvider(network: Network): FlashloanProvider {
  switch (network) {
    case Network.MAINNET:
    case Network.GOERLI:
      return FlashloanProvider.DssFlash
    case Network.OPT_MAINNET:
      return FlashloanProvider.Balancer
    default:
      throw new Error(`Unsupported network ${network}`)
  }
}
