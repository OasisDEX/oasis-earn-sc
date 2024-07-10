import { Network } from '@deploy-configurations/types/network'
import { Protocol } from '@deploy-configurations/types/protocol'
import { FlashloanProvider } from '@dma-library/types/common'

// isolated collaterals does not allow to deposit other tokens (from FL) as collateral
// therefore we need to use isolated collateral as FL token
const aaveIsolatedCollateralTokens = ['LDO', 'FRAX', 'MKR', 'SUSDE']

export function resolveFlashloanProvider({
  network,
  lendingProtocol,
  collateralToken,
  debtToken,
}: {
  network: Network
  lendingProtocol: Protocol
  debtToken: string
  collateralToken: string
}): FlashloanProvider {
  switch (network) {
    case Network.MAINNET:
      if (lendingProtocol === 'Ajna') {
        return FlashloanProvider.Balancer
      }
      if (lendingProtocol === 'Spark' && debtToken !== 'DAI') {
        return FlashloanProvider.Balancer
      }

      if (
        lendingProtocol === 'AAVE_V3' &&
        collateralToken &&
        aaveIsolatedCollateralTokens.includes(collateralToken.toUpperCase())
      ) {
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
