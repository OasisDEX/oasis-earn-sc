import { protocols, strategies } from '@oasisdex/oasis-actions/src'

import { buildGetTokenFunction } from '../../../helpers/aave/'
import init, { resetNode } from '../../../helpers/init'
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
import { StrategiesDependencies, SystemWithAAVEPositions } from '../types'
import { AaveV3PositionStrategy } from '../types/positionDetails'

export function getSupportedAAVEV3Strategies(): AaveV3PositionStrategy[] {
  return ['WSTETH/ETH Earn']
}

export const getSystemWithAAVEV3Positions =
  ({ use1inch }: { use1inch: boolean }) =>
  async (): Promise<SystemWithAAVEPositions> => {
    const config = await init()

    const getTokens = buildGetTokenFunction(config, await import('hardhat'))

    if (testBlockNumber) {
      await resetNode(config.provider, testBlockNumber)
    }
    const { system, registry } = await deploySystem(config, false, true)

    const dependencies: StrategiesDependencies = {
      addresses: {
        ...mainnetAddresses,
        accountFactory: system.common.accountFactory.address,
        operationExecutor: system.common.operationExecutor.address,
      },
      contracts: {
        operationExecutor: system.common.operationExecutor,
      },
      provider: config.provider,
      user: config.address,
      getCurrentPosition: strategies.aave.view,
      getProtocolData: protocols.aave.getOpenV3ProtocolData,
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

    return {
      config,
      system,
      registry,
      strategiesDependencies: dependencies,
      dpmPositions: {
        [stEthEthEarnPosition.strategy]: stEthEthEarnPosition,
        [ethUsdcMultiplyPosition.strategy]: ethUsdcMultiplyPosition,
        [stethUsdcMultiplyPosition.strategy]: stethUsdcMultiplyPosition,
        [wbtcUsdcMultiplyPositon.strategy]: wbtcUsdcMultiplyPositon,
      },
      dsProxyPosition: dsProxyStEthEthEarnPosition,
      getTokens,
    }
  }
