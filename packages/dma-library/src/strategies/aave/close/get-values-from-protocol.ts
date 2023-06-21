import { AaveVersion } from '@dma-library/strategies'
import { getAAVEProtocolServices } from '@dma-library/strategies/aave/close/get-aave-protocol-services'
import { AaveCloseDependencies } from '@dma-library/strategies/aave/close/types'

export async function getValuesFromProtocol(
  protocolVersion: AaveVersion,
  collateralTokenAddress: string,
  debtTokenAddress: string,
  dependencies: AaveCloseDependencies,
) {
  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
    protocolVersion,
    dependencies.provider,
    dependencies.addresses,
  )

  // TODO: Add memoization
  async function getAllAndMemoize() {
    return Promise.all([
      aavePriceOracle.getAssetPrice(dependencies.addresses.DAI),
      aavePriceOracle.getAssetPrice(collateralTokenAddress),
      aavePriceOracle.getAssetPrice(debtTokenAddress),
      aaveProtocolDataProvider.getReserveConfigurationData(dependencies.addresses.DAI),
    ])
  }

  return getAllAndMemoize()
}
