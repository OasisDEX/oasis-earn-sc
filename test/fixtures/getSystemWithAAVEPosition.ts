import BigNumber from 'bignumber.js'

import init, { resetNode } from '../../helpers/init'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { deploySystem } from '../deploySystem'
import { createDPMAccount, createStEthEthEarnAAVEPosition } from './factories'
import { AavePositionStrategy, StrategiesDependencies, SystemWithAAVEPosition } from './types'

export function getSupportedStrategies(): AavePositionStrategy[] {
  return ['STETH/ETH Earn', 'WBTC/USDC Multiply']
}

export async function getSystemWithAAVEPosition(): Promise<SystemWithAAVEPosition> {
  const config = await init()

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

  const dpmProxy = await createDPMAccount(system.common.accountFactory.address, config)

  if (!dpmProxy) {
    throw new Error('Cant create a DPM proxy')
  }

  const stEthEthEarnPosition = await createStEthEthEarnAAVEPosition(
    dpmProxy,
    true,
    dependecies,
    config,
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
    },
    dsProxyPosition: dsProxyStEthEthEarnPosition,
  }
}
