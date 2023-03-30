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

export function getSupportedStrategies(ciMode?: boolean): Array<{
  name: AavePositionStrategy
  localOnly: boolean
}> {
  return [
    { name: 'ETH/USDC Multiply' as AavePositionStrategy, localOnly: false },
    { name: 'WBTC/USDC Multiply' as AavePositionStrategy, localOnly: false },
    { name: 'STETH/USDC Multiply' as AavePositionStrategy, localOnly: true },
    { name: 'STETH/ETH Earn' as AavePositionStrategy, localOnly: true },
  ].filter(s => !ciMode || !s.localOnly)
}

// Do not change test block numbers as they're linked to uniswap liquidity levels
export const blockNumberForAAVEV2System = 15695000

export const getSystemWithAavePositions =
  ({ use1inch }: { use1inch: boolean }) =>
  async (): Promise<SystemWithAAVEPositions> => {
    const ds = new DeploymentSystem(hre)
    const config: RuntimeConfig = await ds.init()
    ds.loadConfig('test-configs/mainnet.conf.ts')

    // If you update test block numbers you may run into issues where whale addresses
    // We use impersonation on test block number but with 1inch we use uniswap
    const getTokens = use1inch
      ? buildGetTokenFunction(config, await import('hardhat'))
      : buildGetTokenByImpersonateFunction(config, await import('hardhat'))
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
    await ds.setupLocalSystem(use1inch)

    const { system, registry, config: systemConfig } = ds.getSystem()
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

    const swapAddress = system.Swap.contract.address

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
      registry,
      strategiesDependencies: dependencies,
      dpmPositions,
      dsProxyPosition: dsProxyStEthEthEarnPosition,
      getTokens,
    }
  }
