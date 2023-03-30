import { Network } from '@helpers/network'

type OneInchVersion = 'v4.0' | 'v5.0'
export const oneInchVersionMap: Record<
  Exclude<Network, Network.LOCAL | Network.HARDHAT | Network.GOERLI>,
  OneInchVersion
> = {
  [Network.MAINNET]: 'v4.0',
  [Network.OPT_MAINNET]: 'v5.0',
}

export function resolveOneInchVersion(network: Network): OneInchVersion {
  if (network !== Network.MAINNET && network !== Network.OPT_MAINNET)
    throw new Error('Unsupported network')

  const version = oneInchVersionMap[network]
  if (!version) throw new Error('Unsupported network')
  return version
}
