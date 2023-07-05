import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies'
import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

export function getAAVEProtocolServices(
  protocolVersion: AaveVersion,
  provider: Provider,
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
) {
  switch (protocolVersion) {
    case AaveVersion.v2:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).priceOracle,
          aavePriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).protocolDataProvider,
          aaveProtocolDataProviderABI,
          provider,
        ),
      }
    case AaveVersion.v3:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).aaveOracle,
          aaveV3PriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).poolDataProvider,
          aaveV3ProtocolDataProviderABI,
          provider,
        ),
      }
    default:
      throw new Error('Unsupported AAVE Version')
  }
}
