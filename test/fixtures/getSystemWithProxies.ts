import { buildGetTokenFunction } from '../../helpers/aave/'
import init, { resetNode } from '../../helpers/init'
import { getOneInchCall } from '../../helpers/swap/OneInchCall'
import { oneInchCallMock } from '../../helpers/swap/OneInchCallMock'
import { mainnetAddresses } from '../addresses'
import { testBlockNumber } from '../config'
import { deploySystem } from '../deploySystem'
import { createDPMAccount } from './factories'
import { StrategiesDependencies, SystemWithProxies } from './types'

export async function getSystemWithProxies({
  use1inch,
}: {
  use1inch: boolean
}): Promise<SystemWithProxies> {
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
    getSwapData: use1inch
      ? swapAddress => getOneInchCall(swapAddress)
      : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
  }

  async function getDpm(): Promise<{ proxy: string; vaultId: number }> {
    const [proxy, vaultId] = await createDPMAccount(system.common.accountFactory.address, config)
    if (!proxy || !vaultId) {
      throw new Error('Cant create a DPM proxy')
    }
    return { proxy, vaultId }
  }

  const dpm1 = await getDpm()
  const dpm2 = await getDpm()
  const dpm3 = await getDpm()
  const dpm4 = await getDpm()

  return {
    config,
    system,
    registry,
    strategiesDependencies: dependecies,
    dsProxy: system.common.userProxyAddress,
    dpmAccounts: [dpm1, dpm2, dpm3, dpm4],
    getTokens,
  }
}