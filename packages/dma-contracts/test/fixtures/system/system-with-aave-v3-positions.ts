import {
  createDPMAccount,
  getOneInchCall,
  oneInchCallMock,
  optimismLiquidityProviders,
  resolveOneInchVersion,
} from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import {
  testBlockNumberForAaveOptimismV3,
  testBlockNumberForAaveV3,
} from '@dma-contracts/test/config'
import {
  ethUsdcMultiplyAavePosition,
  wstethEthEarnAavePosition,
} from '@dma-contracts/test/fixtures/factories'
import {
  AaveV3PositionStrategy,
  PositionDetails,
  StrategyDependenciesAaveV3,
  SystemWithAAVEV3Positions,
} from '@dma-contracts/test/fixtures/types'
import {
  buildGetTokenByImpersonateFunction,
  buildGetTokenFunction,
} from '@dma-contracts/test/utils/aave'
import { DeploymentSystem } from '@dma-deployments/deployment/deploy'
import { Network } from '@dma-deployments/types/network'
import { ChainIdByNetwork } from '@dma-deployments/utils/network'
import { AaveVersion, protocols, strategies } from '@dma-library'
import hre from 'hardhat'

export function getSupportedAaveV3Strategies(network?: Network): Array<{
  name: AaveV3PositionStrategy
  allowedNetworks?: Network[]
}> {
  return [
    { name: 'ETH/USDC Multiply' as AaveV3PositionStrategy },
    // TODO: Monitor if wstETH optimism increase supply cap or update test to modify storage
    { name: 'WSTETH/ETH Earn' as AaveV3PositionStrategy, allowedNetworks: [Network.MAINNET] },
  ].filter(s => (network ? !s.allowedNetworks || s.allowedNetworks.includes(network) : true))
}

const testBlockNumberByNetwork: Record<
  Exclude<Network, Network.LOCAL | Network.GOERLI | Network.HARDHAT>,
  number
> = {
  [Network.MAINNET]: testBlockNumberForAaveV3,
  [Network.OPTIMISM]: testBlockNumberForAaveOptimismV3,
}

export const systemWithAaveV3Positions = ({
  use1inch,
  network,
  hideLogging,
  systemConfigPath,
  configExtensionPaths,
}: {
  use1inch: boolean
  network: Network
  hideLogging?: boolean
  systemConfigPath?: string
  configExtensionPaths?: string[]
}) =>
  async function fixture(): Promise<SystemWithAAVEV3Positions> {
    const ds = new DeploymentSystem(hre)
    const config: RuntimeConfig = await ds.init(hideLogging)
    await ds.loadConfig(systemConfigPath)
    if (configExtensionPaths) {
      configExtensionPaths.forEach(async configPath => {
        await ds.extendConfig(configPath)
      })
    }

    const useFallbackSwap = !use1inch

    if (network !== Network.MAINNET && network !== Network.OPTIMISM)
      throw new Error('Unsupported network')

    if (testBlockNumberByNetwork[network] && useFallbackSwap) {
      await ds.resetNode(testBlockNumberByNetwork[network])
    }

    if (use1inch) {
      await ds.resetNodeToLatestBlock()
    }

    if (!testBlockNumberForAaveV3 && useFallbackSwap) {
      throw 'testBlockNumber is not set'
    }

    await ds.deployAll()
    await ds.addAllEntries()

    const dsSystem = ds.getSystem()
    const { system, registry, config: systemConfig } = dsSystem

    const oneInchVersion = resolveOneInchVersion(network)
    const swapContract = system.uSwap ? system.uSwap.contract : system.Swap.contract
    const swapAddress = swapContract.address

    await swapContract.addFeeTier(0)
    await swapContract.addFeeTier(7)
    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    if (!oneInchVersion) throw new Error('Unsupported network')
    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: {
        DAI: systemConfig.common.DAI.address,
        ETH: systemConfig.common.ETH.address,
        USDC: systemConfig.common.USDC.address,
        WETH: systemConfig.common.WETH.address,
        WSTETH: systemConfig.common.WSTETH.address,
        WBTC: systemConfig.common.WBTC.address,
        chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkPriceOracle_ETHUSD.address,
        aaveOracle: systemConfig.aave.v3.AaveOracle.address,
        pool: systemConfig.aave.v3.Pool.address,
        poolDataProvider: systemConfig.aave.v3.AavePoolDataProvider.address,
        accountFactory: system.AccountFactory.contract.address,
        operationExecutor: system.OperationExecutor.contract.address,
      },
      contracts: {
        operationExecutor: system.OperationExecutor.contract,
      },
      provider: config.provider,
      user: config.address,
      protocol: {
        version: AaveVersion.v3,
        getCurrentPosition: strategies.aave.v3.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      getSwapData: use1inch
        ? swapAddress =>
            getOneInchCall(
              swapAddress,
              // We remove Balancer to avoid re-entrancy errors when also using Balancer FL
              network === Network.OPTIMISM
                ? optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2')
                : [],
              ChainIdByNetwork[network],
              oneInchVersion,
            )
        : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    }

    const getTokens = {
      byImpersonate: buildGetTokenByImpersonateFunction(config, await import('hardhat'), network),
      byUniswap: buildGetTokenFunction(
        config,
        await import('hardhat'),
        network,
        dependencies.addresses.WETH,
      ),
    }

    const [dpmProxyForMultiplyEthUsdc] = await createDPMAccount(system.AccountFactory.contract)
    const [dpmProxyForEarnWstEthEth] = await createDPMAccount(system.AccountFactory.contract)

    const dsProxy = await getOrCreateProxy(system.DSProxyRegistry.contract, config.signer)

    if (!dpmProxyForMultiplyEthUsdc || !dpmProxyForEarnWstEthEth) {
      throw new Error('Cant create a DPM proxy')
    }
    console.log('Setting up fixtures...')
    const ethUsdcMultiplyPosition = await ethUsdcMultiplyAavePosition({
      proxy: dpmProxyForMultiplyEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
      feeRecipient: systemConfig.common.FeeRecipient.address,
    })
    console.log('Position created...')
    let wstethEthEarnPosition: PositionDetails | undefined
    /*
      Re use1inch: Wsteth lacks sufficient liquidity on uniswap
      Re network: wsteth supply cap on optimism reached for now 20/04/23
      TODO: Monitor if wstETH optimism increase supply cap or update test to modify storage
    */
    if (use1inch && network !== Network.OPTIMISM) {
      wstethEthEarnPosition = await wstethEthEarnAavePosition({
        proxy: dpmProxyForEarnWstEthEth,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
        feeRecipient: systemConfig.common.FeeRecipient.address,
      })
    }

    const dsProxyEthUsdcMultiplyPosition = await ethUsdcMultiplyAavePosition({
      proxy: dsProxy.address,
      isDPM: false,
      use1inch,
      swapAddress,
      dependencies,
      config,
      feeRecipient: systemConfig.common.FeeRecipient.address,
    })

    return {
      config,
      hre,
      system,
      registry,
      dsSystem,
      strategiesDependencies: dependencies,
      dpmPositions: {
        ...(ethUsdcMultiplyPosition
          ? { [ethUsdcMultiplyPosition.strategy]: ethUsdcMultiplyPosition }
          : {}),
        ...(wstethEthEarnPosition
          ? { [wstethEthEarnPosition.strategy]: wstethEthEarnPosition }
          : {}),
      },
      dsProxyPosition: dsProxyEthUsdcMultiplyPosition,
      getTokens,
    }
  }
