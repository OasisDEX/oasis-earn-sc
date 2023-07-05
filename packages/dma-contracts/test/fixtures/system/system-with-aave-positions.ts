import { Network } from '@deploy-configurations/types/network'
import { createDPMAccount, getOneInchCall, oneInchCallMock } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import {
  buildGetTokenByImpersonateFunction,
  buildGetTokenFunction,
} from '@dma-contracts/test/utils/aave'
import { createPositionWithRetries } from '@dma-contracts/test/utils/aave/create-position-with-retries'
import { AaveVersion, protocols, strategies } from '@dma-library'
import hre from 'hardhat'

import {
  ethUsdcMultiplyAavePosition,
  stethEthEarnAavePosition,
  stethUsdcMultiplyAavePosition,
  wbtcUsdcMultiplyAavePosition,
} from '../factories'
import { AavePositionStrategy, SystemWithAavePositions } from '../types'
import { StrategyDependenciesAaveV2 } from '../types/strategies-dependencies'

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

export const systemWithAavePositions = ({
  use1inch,
  hideLogging,
  configExtensionPaths,
  network,
}: {
  use1inch: boolean
  hideLogging?: boolean
  configExtensionPaths?: string[]
  network: Network
}) =>
  async function fixture(): Promise<SystemWithAavePositions> {
    const ds = new DeploymentSystem(hre)
    const config: RuntimeConfig = await ds.init(hideLogging)
    const systemConfigPath = `test/${network}.conf.ts`
    console.log('Loading config from', systemConfigPath)
    await ds.loadConfig(systemConfigPath)
    if (configExtensionPaths) {
      for (const configPath of configExtensionPaths) {
        await ds.extendConfig(configPath)
      }
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
    await ds.replaceSwapContracts()

    const dsSystem = ds.getSystem()
    const { system, registry, config: systemConfig } = dsSystem
    const swapContract = system.uSwap ? system.uSwap.contract : system.Swap.contract
    const swapAddress = swapContract.address

    if (!systemConfig.aave.v2) throw new Error('aave v2 not deployed')
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
        chainlinkEthUsdPriceFeed: systemConfig.common.ChainlinkPriceOracle_ETHUSD.address,
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

    // const getTokens = buildGetTokenFunctionByStorage(ds, network)

    const getTokens = {
      byImpersonate: buildGetTokenByImpersonateFunction(
        config,
        await import('hardhat'),
        Network.MAINNET,
      ),
      byUniswap: buildGetTokenFunction(
        config,
        await import('hardhat'),
        Network.MAINNET,
        dependencies.addresses.WETH,
      ),
    }
    const preferredGetTokenFn = use1inch ? getTokens.byUniswap : getTokens.byImpersonate

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

    /*
     * When block timestamps are close together in testing
     * The timestamp difference between when the reserve liquidity index was last updated can be very small
     * In turn this can lead to precision issues in the linear interest calculation that gives out by 1 errors
     * See https://github.com/aave/protocol-v2/blob/ce53c4a8c8620125063168620eba0a8a92854eb8/contracts/protocol/libraries/logic/ReserveLogic.sol#LL57C1-L57C1
     */
    const stEthEthEarnPosition = await createPositionWithRetries(
      hre.ethers,
      stethEthEarnAavePosition,
      {
        proxy: dpmProxyForEarnStEthEth,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
        feeRecipient: systemConfig.common.FeeRecipient.address,
        network,
      },
    )

    const ethUsdcMultiplyPosition = await createPositionWithRetries(
      hre.ethers,
      ethUsdcMultiplyAavePosition,
      {
        proxy: dpmProxyForMultiplyEthUsdc,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
        feeRecipient: systemConfig.common.FeeRecipient.address,
        network,
      },
    )

    const stethUsdcMultiplyPosition = await createPositionWithRetries(
      hre.ethers,
      await stethUsdcMultiplyAavePosition,
      {
        proxy: dpmProxyForMultiplyStEthUsdc,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
        getTokens: preferredGetTokenFn,
        network,
      },
    )

    const wbtcUsdcMultiplyPosition = await createPositionWithRetries(
      hre.ethers,
      wbtcUsdcMultiplyAavePosition,
      {
        proxy: dpmProxyForMultiplyWbtcUsdc,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
        getTokens: preferredGetTokenFn,
        network,
      },
    )

    const dsProxyStEthEthEarnPosition = await createPositionWithRetries(
      hre.ethers,
      stethEthEarnAavePosition,
      {
        proxy: dsProxy.address,
        isDPM: false,
        use1inch,
        swapAddress,
        dependencies,
        config,
        feeRecipient: systemConfig.common.FeeRecipient.address,
        network,
      },
    )

    const dpmPositions = {
      ...(stEthEthEarnPosition ? { [stEthEthEarnPosition.strategy]: stEthEthEarnPosition } : {}),
      ...(ethUsdcMultiplyPosition
        ? { [ethUsdcMultiplyPosition.strategy]: ethUsdcMultiplyPosition }
        : {}),
      ...(stethUsdcMultiplyPosition
        ? { [stethUsdcMultiplyPosition.strategy]: stethUsdcMultiplyPosition }
        : {}),
      ...(wbtcUsdcMultiplyPosition
        ? { [wbtcUsdcMultiplyPosition.strategy]: wbtcUsdcMultiplyPosition }
        : {}),
    }

    return {
      config,
      hre,
      system,
      dsSystem,
      registry,
      strategiesDependencies: dependencies,
      dpmPositions,
      dsProxyPosition: dsProxyStEthEthEarnPosition,
      getTokens,
    }
  }
