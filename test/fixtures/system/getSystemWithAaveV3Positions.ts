import { protocols, strategies } from '@oasisdex/oasis-actions/src'

import { buildGetTokenFunction } from '../../../helpers/aave/'
import init, { resetNode } from '../../../helpers/init'
import { getOneInchCall } from '../../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../../addresses'
import { testBlockNumber } from '../../config'
import { deploySystem } from '../../deploySystem'
import { createDPMAccount, createEthUsdcMultiplyAAVEPosition } from '../factories'
import { createWstEthEthEarnAAVEPosition } from '../factories/createWstEthEthEarnAAVEPosition'
import { StrategiesDependencies } from '../types'
import { AaveV3PositionStrategy } from '../types/positionDetails'
import { SystemWithAAVEV3Positions } from '../types/systemWithAAVEPositions'

export function getSupportedAaveV3Strategies(): AaveV3PositionStrategy[] {
  return ['ETH/USDC Multiply', 'WSTETH/ETH Earn']
}

export const getSystemWithAaveV3Positions =
  ({ use1inch }: { use1inch: boolean }) =>
  async (): Promise<SystemWithAAVEV3Positions> => {
    const config = await init()
    const getTokens = buildGetTokenFunction(config, await import('hardhat'))

    if (testBlockNumber) {
      await resetNode(config.provider, testBlockNumber)
    }

    const useFallbackSwap = !use1inch
    const { system, registry } = await deploySystem(config, false, useFallbackSwap)

    const dependencies: StrategiesDependencies = {
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
        version: 3,
        getCurrentPosition: strategies.aave.view,
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

    const wstethEthEarnPosition = await createWstEthEthEarnAAVEPosition({
      proxy: dpmProxyForEarnWstEthEth,
      isDPM: true,
      use1inch,
      swapAddress,
      dependencies,
      config,
    })

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
        [ethUsdcMultiplyPosition.strategy]: ethUsdcMultiplyPosition,
        [wstethEthEarnPosition.strategy]: wstethEthEarnPosition,
      },
      dsProxyPosition: dsProxyEthUsdcMultiplyPosition,
      getTokens,
    }
  }
