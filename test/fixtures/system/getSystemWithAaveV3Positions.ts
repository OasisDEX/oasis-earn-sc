import { ChainIdByNetwork, Network } from '@helpers/network'
import { getOrCreateProxy } from '@helpers/proxy'
import { RuntimeConfig } from '@helpers/types/common'
import { AaveVersion, protocols, strategies } from '@oasisdex/oasis-actions/src'
import hre from 'hardhat'

import { buildGetTokenFunction } from '../../../helpers/aave/'
import { getOneInchCall, optimismLiquidityProviders } from '../../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../../helpers/swap/OneInchCallMock'
import { DeploymentSystem } from '../../../scripts/deployment20/deploy'
import { testBlockNumberForAaveOptimismV3, testBlockNumberForAaveV3 } from '../../config'
import { createDPMAccount, createEthUsdcMultiplyAAVEPosition } from '../factories'
import { createWstEthEthEarnAAVEPosition } from '../factories/createWstEthEthEarnAAVEPosition'
import { AaveV3PositionStrategy, PositionDetails } from '../types/positionDetails'
import { StrategyDependenciesAaveV3 } from '../types/strategiesDependencies'
import { SystemWithAAVEV3Positions } from '../types/systemWithAAVEPositions'

export function getSupportedAaveV3Strategies(ciMode?: boolean): Array<{
  name: AaveV3PositionStrategy
  /* Test should only be run locally as is flakey */
  localOnly: boolean
}> {
  return [
    { name: 'ETH/USDC Multiply' as AaveV3PositionStrategy, localOnly: false },
    { name: 'WSTETH/ETH Earn' as AaveV3PositionStrategy, localOnly: false },
  ].filter(s => !ciMode || !s.localOnly)
}

const testBlockNumberByNetwork: Record<
  Exclude<Network, Network.LOCAL | Network.GOERLI | Network.HARDHAT>,
  number
> = {
  [Network.MAINNET]: testBlockNumberForAaveV3,
  [Network.OPT_MAINNET]: testBlockNumberForAaveOptimismV3,
}

export const getSystemWithAaveV3Positions =
  ({
    use1inch,
    network,
    systemConfigPath,
    configExtentionPaths,
  }: {
    use1inch: boolean
    network: Network
    systemConfigPath?: string
    configExtentionPaths?: string[]
  }) =>
  async (): Promise<SystemWithAAVEV3Positions> => {
    const ds = new DeploymentSystem(hre)
    const config: RuntimeConfig = await ds.init()

    await ds.loadConfig(systemConfigPath)
    if (configExtentionPaths) {
      configExtentionPaths.forEach(async configPath => {
        await ds.extendConfig(configPath)
      })
    }
    // We're using uniswap to get tokens here rather than impersonating a user
    const getTokens = buildGetTokenFunction(config, await import('hardhat'))

    const useFallbackSwap = !use1inch

    if (network !== Network.MAINNET && network !== Network.OPT_MAINNET)
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

    const { system, registry, config: systemConfig } = ds.getSystem()

    const swapContract = system.uSwap ? system.uSwap.contract : system.Swap.contract
    const swapAddress = swapContract.address

    await swapContract.addFeeTier(0)
    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    const oneInchVersionMap = {
      [Network.MAINNET]: 'v4.0' as const,
      [Network.OPT_MAINNET]: 'v5.0' as const,
    }
    const oneInchVersion = oneInchVersionMap[network]
    if (!oneInchVersion) throw new Error('Unsupported network')
    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: {
        DAI: systemConfig.common.DAI.address,
        ETH: systemConfig.common.ETH.address,
        USDC: systemConfig.common.USDC.address,
        WETH: systemConfig.common.WETH.address,
        WSTETH: systemConfig.common.WSTETH.address,
        WBTC: systemConfig.common.WBTC.address,
        chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkEthUsdPriceFeed.address,
        aaveOracle: systemConfig.aave.v3.AaveOracle.address,
        pool: systemConfig.aave.v3.Pool.address,
        poolDataProvider: systemConfig.aave.v3.AaveProtocolDataProvider.address,
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
              network === Network.OPT_MAINNET
                ? optimismLiquidityProviders.filter(l => l !== 'OPTIMISM_BALANCER_V2')
                : [],
              ChainIdByNetwork[network],
              oneInchVersion,
            )
        : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    }

    const [dpmProxyForMultiplyEthUsdc] = await createDPMAccount(system.AccountFactory.contract)
    const [dpmProxyForEarnWstEthEth] = await createDPMAccount(system.AccountFactory.contract)

    const dsProxy = await getOrCreateProxy(system.DSProxyRegistry.contract, config.signer)

    if (!dpmProxyForMultiplyEthUsdc || !dpmProxyForEarnWstEthEth) {
      throw new Error('Cant create a DPM proxy')
    }

    const configWithDeployedSystem = {
      ...config,
      ds,
      network,
    }

    const ethUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
    })

    let wstethEthEarnPosition: PositionDetails | undefined
    /* Re use1inch: Wsteth lacks sufficient liquidity on uniswap */
    if (use1inch) {
      wstethEthEarnPosition = await createWstEthEthEarnAAVEPosition({
        proxy: dpmProxyForEarnWstEthEth,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config: configWithDeployedSystem,
      })
    }

    const dsProxyEthUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: dsProxy.address,
      isDPM: false,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
    })

    return {
      config,
      system,
      registry,
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
