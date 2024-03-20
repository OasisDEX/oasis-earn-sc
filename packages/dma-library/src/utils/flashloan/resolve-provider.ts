import { Network } from '@deploy-configurations/types/network'
import { Protocol } from '@deploy-configurations/types/protocol'
import { FlashloanProvider } from '@dma-library/types/common'

export function resolveFlashloanProvider(
  network: Network,
  lendingProtocol?: Protocol,
  debtToken?: string,
): FlashloanProvider {
  switch (network) {
    case Network.MAINNET:
      if (lendingProtocol === 'Ajna') {
        return FlashloanProvider.Balancer
      }
      if (lendingProtocol === 'Spark' && debtToken !== 'DAI') {
        return FlashloanProvider.Balancer
      }
      return FlashloanProvider.DssFlash
    case Network.GOERLI:
      return FlashloanProvider.DssFlash
    case Network.OPTIMISM:
      return FlashloanProvider.Balancer
    case Network.ARBITRUM:
      return FlashloanProvider.Balancer
    case Network.BASE:
      return FlashloanProvider.Balancer
    default:
      throw new Error(`Unsupported network ${network}`)
  }
}
