import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { addressesByNetwork } from '@dma-common/test-utils'
import { getAaveLikeSystemContracts } from '@dma-library/protocols/aave-like/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function fetchAAVEContracts(
  hre: HardhatRuntimeEnvironment,
  system: DeployedSystem,
  network: Network,
) {
  const addresses = addressesByNetwork(network)

  const aaveLikeAddresses = {
    tokens: {
      WETH: addresses.WETH,
      DAI: addresses.DAI,
      USDC: addresses.USDC,
      ETH: addresses.ETH,
    },
    operationExecutor: system.OperationExecutor.contract.address,
    chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
    oracle: addresses.aaveOracle,
    lendingPool: addresses.pool,
    poolDataProvider: addresses.poolDataProvider,
  }

  return await getAaveLikeSystemContracts(aaveLikeAddresses, hre.ethers.provider, 'AAVE_V3')
}
