import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AaveVersion } from '@dma-library/types/aave'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

export function getAAVEProtocolServices(
  protocolVersion: AaveVersion,
  provider: Provider,
  addresses: AaveLikeStrategyAddresses,
) {
  switch (protocolVersion) {
    case AaveVersion.v2:
      return {
        aavePriceOracle: new ethers.Contract(addresses.oracle, aavePriceOracleABI, provider),
        aaveProtocolDataProvider: new ethers.Contract(
          addresses.poolDataProvider,
          aaveProtocolDataProviderABI,
          provider,
        ),
      }
    case AaveVersion.v3:
      return {
        aavePriceOracle: new ethers.Contract(addresses.oracle, aaveV3PriceOracleABI, provider),
        aaveProtocolDataProvider: new ethers.Contract(
          addresses.poolDataProvider,
          aaveV3ProtocolDataProviderABI,
          provider,
        ),
      }
    default:
      throw new Error('Unsupported AAVE Version')
  }
}
