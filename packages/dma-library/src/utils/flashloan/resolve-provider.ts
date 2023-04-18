import { Network } from '@oasisdex/dma-deployments/types/network'

import { FlashloanProvider } from '../../types/common'

export function resolveFlashloanProvider(network: Network): FlashloanProvider {
  switch (network) {
    case Network.MAINNET:
    case Network.GOERLI:
      return FlashloanProvider.DssFlash
    case Network.OPTIMISM:
      return FlashloanProvider.Balancer
    default:
      throw new Error(`Unsupported network ${network}`)
  }
}
