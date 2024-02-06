import { Network } from '@deploy-configurations/types/network'
import { providers } from 'ethers'

export function isSupportedNetwork(network: string): network is Network {
  return Object.values<string>(Network).includes(network)
}

export const getNetwork = async (provider: providers.Provider): Promise<Network> => {
  const chainId = (await provider.getNetwork()).chainId
  return NetworkByChainId[chainId]
}

export const getForkedNetwork = async (
  provider: providers.Provider,
): Promise<Exclude<Network, Network.LOCAL | Network.HARDHAT>> => {
  const network = await getNetwork(provider)
  if (network === Network.LOCAL) {
    const localProvider = provider as providers.JsonRpcProvider
    if (!(localProvider as providers.JsonRpcProvider).send)
      throw new Error('Provider does not support send method')
    const metadata = await localProvider.send('hardhat_metadata', [])
    return ForkedNetworkByChainId[metadata.forkedNetwork.chainId]
  }

  if (!isForkedNetwork(network)) throw new Error(`Unsupported forked network ${network}`)

  return network
}

function isForkedNetwork(
  network: Network,
): network is Exclude<Network, Network.LOCAL | Network.HARDHAT> {
  return network !== Network.LOCAL && network !== Network.HARDHAT
}

export const ForkedNetworkByChainId: {
  [key: number]: Exclude<Network, Network.LOCAL | Network.HARDHAT>
} = {
  1: Network.MAINNET,
  5: Network.GOERLI,
  10: Network.OPTIMISM,
  42161: Network.ARBITRUM,
  8453: Network.BASE,
}

export const NetworkByChainId: { [key: number]: Network } = {
  ...ForkedNetworkByChainId,
  2137: Network.LOCAL,
}

export const ChainIdByNetwork: Record<Network, number> = {
  [Network.MAINNET]: 1,
  [Network.GOERLI]: 5,
  [Network.OPTIMISM]: 10,
  [Network.ARBITRUM]: 42161,
  [Network.BASE]: 8453,
  [Network.LOCAL]: 1,
  [Network.HARDHAT]: 1,
  [Network.TENDERLY]: 1,
  [Network.TEST]: 1,
  [Network.SEPOLIA]: 11155111,
}
