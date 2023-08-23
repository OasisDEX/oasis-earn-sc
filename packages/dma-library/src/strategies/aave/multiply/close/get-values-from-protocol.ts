import { AaveVersion } from '@dma-library/types/aave'
import BigNumber from 'bignumber.js'

import { getAAVEProtocolServices } from './get-aave-protocol-services'
import { AaveCloseDependencies } from './types'

export interface AaveValuesFromProtocol {
  flashloanTokenPrice: BigNumber
  collateralTokenPrice: BigNumber
  debtTokenPrice: BigNumber
  reserveDataForFlashloan: { ltv: BigNumber }
}

export async function getValuesFromProtocol(
  protocolVersion: AaveVersion,
  collateralTokenAddress: string,
  debtTokenAddress: string,
  flashloanTokenAddress: string,
  dependencies: AaveCloseDependencies,
): Promise<AaveValuesFromProtocol> {
  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
    protocolVersion,
    dependencies.provider,
    dependencies.addresses,
  )

  return Promise.all([
    aavePriceOracle
      .getAssetPrice(flashloanTokenAddress)
      .then(price => new BigNumber(price.toString())),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then(price => new BigNumber(price.toString())),
    aavePriceOracle.getAssetPrice(debtTokenAddress).then(price => new BigNumber(price.toString())),
    aaveProtocolDataProvider
      .getReserveConfigurationData(flashloanTokenAddress)
      .then(({ ltv }) => ({ ltv: new BigNumber(ltv.toString()) })),
  ]).then(
    ([flashloanTokenPrice, collateralTokenPrice, debtTokenPrice, reserveDataForFlashloan]) => {
      return {
        flashloanTokenPrice,
        collateralTokenPrice,
        debtTokenPrice,
        reserveDataForFlashloan,
      }
    },
  )
}
