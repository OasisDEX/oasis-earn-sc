import BigNumber from 'bignumber.js'

import { buildGetTokenFunction } from '../../helpers/aave/'
import init, { resetNode } from '../../helpers/init'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { deploySystem } from '../deploySystem'
import {
  createDPMAccount,
  createEthUsdcMultiplyAAVEPosition,
  createStEthEthEarnAAVEPosition,
  createStEthUsdcMultiplyAAVEPosition,
  createWbtcUsdcMultiplyAAVEPosition,
} from './factories'
import { AavePositionStrategy, StrategiesDependencies, SystemWithAAVEPosition } from './types'

export function getSupportedStrategies(): AavePositionStrategy[] {
  return ['ETH/USDC Multiply', 'STETH/USDC Multiply', 'WBTC/USDC Multiply', 'STETH/ETH Earn']
}

export async function getSystemWithAAVEPosition(): Promise<SystemWithAAVEPosition> {
  const config = await init()

  const getTokens = buildGetTokenFunction(config, await import('hardhat'))

  if (testBlockNumber) {
    await resetNode(config.provider, testBlockNumber)
  }
  const { system, registry } = await deploySystem(config, false, true)

  const dependecies: StrategiesDependencies = {
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
    getSwapData: oneInchCallMock(new BigNumber(0.9759)),
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

  const stEthEthEarnPosition = await createStEthEthEarnAAVEPosition(
    dpmProxyForEarnStEthEth,
    true,
    dependecies,
    config,
  )

  const ethUsdcMultiplyPosition = await createEthUsdcMultiplyAAVEPosition(
    dpmProxyForMultiplyEthUsdc,
    true,
    dependecies,
    config,
  )

  const stethUsdcMultiplyPosition = await createStEthUsdcMultiplyAAVEPosition(
    dpmProxyForMultiplyStEthUsdc,
    true,
    dependecies,
    config,
    getTokens,
  )

  const wbtcUsdcMultiplyPositon = await createWbtcUsdcMultiplyAAVEPosition(
    dpmProxyForMultiplyWbtcUsdc,
    true,
    dependecies,
    config,
    getTokens,
  )

  const dsProxyStEthEthEarnPosition = await createStEthEthEarnAAVEPosition(
    system.common.userProxyAddress,
    false,
    dependecies,
    config,
  )

  return {
    config,
    system,
    registry,
    strategiesDependencies: dependecies,
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
