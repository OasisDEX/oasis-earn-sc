import { AaveVersion, protocols, strategies } from '@oasisdex/oasis-actions/src'

import { buildGetTokenByImpersonateFunction, buildGetTokenFunction } from '../../../helpers/aave/'
import init, { resetNode, resetNodeToLatestBlock } from '../../../helpers/init'
import { getOneInchCall } from '../../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../../addresses'
import { testBlockNumber } from '../../config'
import { deploySystem } from '../../deploySystem'
import {
  createDPMAccount,
  createEthUsdcMultiplyAAVEPosition,
  createStEthEthEarnAAVEPosition,
  createStEthUsdcMultiplyAAVEPosition,
  createWbtcUsdcMultiplyAAVEPosition,
} from '../factories'
import { AavePositionStrategy, StrategiesDependencies, SystemWithAAVEPositions } from '../types'

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

export const getSystemWithAavePositions =
  ({ use1inch }: { use1inch: boolean }) =>
  async (): Promise<SystemWithAAVEPositions> => {
    const config = await init()

    // If you update test block numbers you may run into issues where whale addresses
    // We use impersonation on test block number but with 1inch we use uniswap
    const getTokens = use1inch
      ? buildGetTokenFunction(config, await import('hardhat'))
      : buildGetTokenByImpersonateFunction(config, await import('hardhat'))
    const useFallbackSwap = !use1inch
    if (testBlockNumber && useFallbackSwap) {
      await resetNode(config.provider, testBlockNumber)
    }

    if (use1inch) {
      await resetNodeToLatestBlock(config.provider)
    }

    if (!testBlockNumber && useFallbackSwap) {
      throw 'testBlockNumber is not set'
    }

    const { system, registry } = await deploySystem(config, false, useFallbackSwap)

    const dependencies: StrategiesDependencies = {
      addresses: {
        ...mainnetAddresses,
        priceOracle: mainnetAddresses.aave.v2.priceOracle,
        lendingPool: mainnetAddresses.aave.v2.lendingPool,
        protocolDataProvider: mainnetAddresses.aave.v2.protocolDataProvider,
        accountFactory: system.common.accountFactory.address,
        operationExecutor: system.common.operationExecutor.address,
      },
      contracts: {
        operationExecutor: system.common.operationExecutor,
      },
      provider: config.provider,
      user: config.address,
      protocol: {
        version: AaveVersion.v2,
        getCurrentPosition: strategies.aave.v2.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      getSwapData: use1inch
        ? swapAddress => getOneInchCall(swapAddress)
        : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    }

    const [dpmProxyForEarnStEthEth] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )
    const [dpmProxyForMultiplyEthUsdc] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )
    const [dpmProxyForMultiplyStEthUsdc] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )
    const [dpmProxyForMultiplyWbtcUsdc] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )

    if (
      !dpmProxyForEarnStEthEth ||
      !dpmProxyForMultiplyStEthUsdc ||
      !dpmProxyForMultiplyEthUsdc ||
      !dpmProxyForMultiplyWbtcUsdc
    ) {
      throw new Error('Cant create a DPM proxy')
    }

    const swapAddress = system.common.swap.address

    const stEthEthEarnPosition = await createStEthEthEarnAAVEPosition({
      proxy: dpmProxyForEarnStEthEth,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
    })

    const ethUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
    })

    const stethUsdcMultiplyPosition = await createStEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyStEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
      getTokens,
    })

    const wbtcUsdcMultiplyPositon = await createWbtcUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyWbtcUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
      getTokens,
    })

    const dsProxyStEthEthEarnPosition = await createStEthEthEarnAAVEPosition({
      proxy: system.common.userProxyAddress,
      isDPM: false,
      use1inch,
      swapAddress,
      dependencies,
      config,
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
