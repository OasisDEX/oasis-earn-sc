import { Network } from '@helpers/network'
import { getOrCreateProxy } from '@helpers/proxy'
import { RuntimeConfig } from '@helpers/types/common'
import { AaveVersion, protocols, strategies } from '@oasisdex/oasis-actions/src'
import hre from 'hardhat'

import { buildGetTokenByImpersonateFunction, buildGetTokenFunction } from '../../../helpers/aave/'
import { getOneInchCall } from '../../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../../helpers/swap/OneInchCallMock'
import { DeploymentSystem } from '../../../scripts/deployment20/deploy'
import {
  createDPMAccount,
  createEthUsdcMultiplyAAVEPosition,
  createStEthEthEarnAAVEPosition,
  createStEthUsdcMultiplyAAVEPosition,
  createWbtcUsdcMultiplyAAVEPosition,
} from '../factories'
import { AavePositionStrategy, SystemWithAAVEPositions } from '../types'
import { StrategyDependenciesAaveV2 } from '../types/strategiesDependencies'

export function getSupportedStrategies(): Array<{
  name: AavePositionStrategy
}> {
  return [
    { name: 'ETH/USDC Multiply' as AavePositionStrategy },
    { name: 'WBTC/USDC Multiply' as AavePositionStrategy },
    { name: 'STETH/USDC Multiply' as AavePositionStrategy },
    { name: 'STETH/ETH Earn' as AavePositionStrategy },
  ]
}

// Do not change test block numbers as they're linked to uniswap liquidity levels
export const blockNumberForAAVEV2System = 15695000

export const getSystemWithAavePositions =
  ({ use1inch, configExtentionsPaths }: { use1inch: boolean; configExtentionsPaths?: string[] }) =>
  async (): Promise<SystemWithAAVEPositions> => {
    const ds = new DeploymentSystem(hre)
    const config: RuntimeConfig = await ds.init()
    const systemConfigPath = './test-configs/mainnet.conf.ts'
    await ds.loadConfig(systemConfigPath)
    if (configExtentionsPaths) {
      configExtentionsPaths.forEach(async configPath => {
        await ds.extendConfig(configPath)
      })
    }

    const useFallbackSwap = !use1inch
    if (blockNumberForAAVEV2System && useFallbackSwap) {
      await ds.resetNode(blockNumberForAAVEV2System)
    }

    if (use1inch) {
      await ds.resetNodeToLatestBlock()
    }

    if (!blockNumberForAAVEV2System && useFallbackSwap) {
      throw 'testBlockNumber is not set'
    }

    await ds.deployAll()
    await ds.addAllEntries()

    const dsSystem = ds.getSystem()
    const { system, registry, config: systemConfig } = dsSystem
    const swapContract = system.uSwap ? system.uSwap.contract : system.Swap.contract
    const swapAddress = swapContract.address

    !use1inch &&
      (await swapContract.setPool(
        systemConfig.common.STETH.address,
        systemConfig.common.WETH.address,
        10000,
      ))
    await swapContract.addFeeTier(0)
    await swapContract.addFeeTier(7)
    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    if (!systemConfig.aave.v2) throw new Error('aave v2 is not configured')
    const dependencies: StrategyDependenciesAaveV2 = {
      addresses: {
        DAI: systemConfig.common.DAI.address,
        ETH: systemConfig.common.ETH.address,
        WETH: systemConfig.common.WETH.address,
        STETH: systemConfig.common.STETH.address,
        WBTC: systemConfig.common.WBTC.address,
        USDC: systemConfig.common.USDC.address,
        chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkEthUsdPriceFeed.address,
        priceOracle: systemConfig.aave.v2.PriceOracle.address,
        lendingPool: systemConfig.aave.v2.LendingPool.address,
        protocolDataProvider: systemConfig.aave.v2.ProtocolDataProvider.address,
        accountFactory: system.AccountFactory.contract.address,
        operationExecutor: system.OperationExecutor.contract.address,
      },
      contracts: {
        operationExecutor: system.OperationExecutor.contract,
      },
      provider: config.provider,
      user: config.address,
      protocol: {
        version: AaveVersion.v2,
        getCurrentPosition: strategies.aave.v2.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      getSwapData: use1inch
        ? swapAddress => getOneInchCall(swapAddress, [])
        : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    }

    // If you update test block numbers you may run into issues where whale addresses
    // We use impersonation on test block number but with 1inch we use uniswap
    const getTokens = use1inch
      ? buildGetTokenFunction(
          config,
          await import('hardhat'),
          Network.MAINNET,
          dependencies.addresses.WETH,
        )
      : buildGetTokenByImpersonateFunction(config, await import('hardhat'), Network.MAINNET)

    const [dpmProxyForEarnStEthEth] = await createDPMAccount(system.AccountFactory.contract)
    const [dpmProxyForMultiplyEthUsdc] = await createDPMAccount(system.AccountFactory.contract)
    const [dpmProxyForMultiplyStEthUsdc] = await createDPMAccount(system.AccountFactory.contract)
    const [dpmProxyForMultiplyWbtcUsdc] = await createDPMAccount(system.AccountFactory.contract)

    const dsProxy = await getOrCreateProxy(system.DSProxyRegistry.contract, config.signer)

    if (
      !dpmProxyForEarnStEthEth ||
      !dpmProxyForMultiplyStEthUsdc ||
      !dpmProxyForMultiplyEthUsdc ||
      !dpmProxyForMultiplyWbtcUsdc
    ) {
      throw new Error('Cant create a DPM proxy')
    }

    const configWithDeployedSystem = {
      ...config,
      ds,
    }

    const stEthEthEarnPosition = await createStEthEthEarnAAVEPosition({
      proxy: dpmProxyForEarnStEthEth,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
    })

    const ethUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
    })

    const stethUsdcMultiplyPosition = await createStEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyStEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
      getTokens,
    })

    const wbtcUsdcMultiplyPositon = await createWbtcUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyWbtcUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
      getTokens,
    })

    const dsProxyStEthEthEarnPosition = await createStEthEthEarnAAVEPosition({
      proxy: dsProxy.address,
      isDPM: false,
      use1inch,
      swapAddress,
      dependencies,
      config: configWithDeployedSystem,
    })

    const dpmPositions = {
      ...(stEthEthEarnPosition ? { [stEthEthEarnPosition.strategy]: stEthEthEarnPosition } : {}),
      ...(ethUsdcMultiplyPosition
        ? { [ethUsdcMultiplyPosition.strategy]: ethUsdcMultiplyPosition }
        : {}),
      ...(stethUsdcMultiplyPosition
        ? { [stethUsdcMultiplyPosition.strategy]: stethUsdcMultiplyPosition }
        : {}),
      ...(wbtcUsdcMultiplyPositon
        ? { [wbtcUsdcMultiplyPositon.strategy]: wbtcUsdcMultiplyPositon }
        : {}),
    }

    return {
      config,
      system,
      dsSystem,
      registry,
      strategiesDependencies: dependencies,
      dpmPositions,
      dsProxyPosition: dsProxyStEthEthEarnPosition,
      getTokens,
    }
  }
