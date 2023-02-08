import { AaveVersion, protocols, strategies } from '@oasisdex/oasis-actions/src'

import { buildGetTokenFunction } from '../../../helpers/aave/'
import init, { resetNode, resetNodeToLatestBlock } from '../../../helpers/init'
import { getOneInchCall } from '../../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../../addresses'
import { testBlockNumberForAaveV3 } from '../../config'
import { deploySystem } from '../../deploySystem'
import { createDPMAccount, createEthUsdcMultiplyAAVEPosition } from '../factories'
import { createWstEthEthEarnAAVEPosition } from '../factories/createWstEthEthEarnAAVEPosition'
import { AaveV3PositionStrategy } from '../types/positionDetails'
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

export const getSystemWithAaveV3Positions =
  ({ use1inch }: { use1inch: boolean }) =>
  async (): Promise<SystemWithAAVEV3Positions> => {
    const config = await init()
    // We're using uniswap to get tokens here rather than impersonating a user
    const getTokens = buildGetTokenFunction(config, await import('hardhat'))

    const useFallbackSwap = !use1inch
    if (testBlockNumberForAaveV3 && useFallbackSwap) {
      await resetNode(config.provider, testBlockNumberForAaveV3)
    }

    if (use1inch) {
      await resetNodeToLatestBlock(config.provider)
    }

    if (!testBlockNumberForAaveV3 && useFallbackSwap) {
      throw 'testBlockNumber is not set'
    }

    const { system, registry } = await deploySystem(config, false, useFallbackSwap)

    const dependencies: StrategyDependenciesAaveV3 = {
      addresses: {
        ...mainnetAddresses,
        aaveOracle: mainnetAddresses.aave.v3.aaveOracle,
        pool: mainnetAddresses.aave.v3.pool,
        aaveProtocolDataProvider: mainnetAddresses.aave.v3.aaveProtocolDataProvider,
        accountFactory: system.common.accountFactory.address,
        operationExecutor: system.common.operationExecutor.address,
      },
      contracts: {
        operationExecutor: system.common.operationExecutor,
      },
      provider: config.provider,
      user: config.address,
      protocol: {
        version: AaveVersion.v3,
        getCurrentPosition: strategies.aave.v3.view,
        getProtocolData: protocols.aave.getAaveProtocolData,
      },
      getSwapData: use1inch
        ? swapAddress => getOneInchCall(swapAddress)
        : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
    }

    const [dpmProxyForMultiplyEthUsdc] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )
    const [dpmProxyForEarnWstEthEth] = await createDPMAccount(
      system.common.accountFactory.address,
      config,
    )

    if (!dpmProxyForMultiplyEthUsdc || !dpmProxyForEarnWstEthEth) {
      throw new Error('Cant create a DPM proxy')
    }

    const swapAddress = system.common.swap.address

    const ethUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: dpmProxyForMultiplyEthUsdc,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
    })

    let wstethEthEarnPosition
    /* Wsteth lacks sufficient liquidity on uniswap */
    if (use1inch) {
      wstethEthEarnPosition = await createWstEthEthEarnAAVEPosition({
        proxy: dpmProxyForEarnWstEthEth,
        isDPM: true,
        use1inch,
        swapAddress,
        dependencies,
        config,
      })
    }

    const dsProxyEthUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition({
      proxy: system.common.userProxyAddress,
      isDPM: false,
      use1inch,
      swapAddress,
      dependencies,
      config,
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
