import { createDPMAccount } from '../factories'
import { StrategiesDependencies, SystemWithProxies } from '../types'
import { mainnetAddresses } from '@dma-library/test/addresses'
import { getOneInchCall } from '@oasisdex/dma-common/utils/swap/OneInchCall'
import { testBlockNumber } from '@dma-library/test/config'
import { oneInchCallMock } from '@oasisdex/dma-common/utils/swap/OneInchCallMock'
import { buildGetTokenByImpersonateFunction } from 'test/utils/aave'
import init, { resetNode } from '@oasisdex/dma-common/utils/init'
import { AaveVersion, protocols, strategies } from '@dma-library'
import { deploySystem } from '@dma-library/test/utils'

export async function getSystemWithProxies({
  use1inch,
}: {
  use1inch: boolean
}): Promise<SystemWithProxies> {
  const config = await init()

  const getTokens = buildGetTokenByImpersonateFunction(config, await import('hardhat'))

  if (testBlockNumber) {
    await resetNode(config.provider, testBlockNumber)
  }
  const { system, registry } = await deploySystem(config, false, true)

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
    protocol: {
      version: AaveVersion.v2,
      getCurrentPosition: strategies.aave.v2.view,
      getProtocolData: protocols.aave.getAaveProtocolData,
    },
    provider: config.provider,
    user: config.address,
    getSwapData: use1inch
      ? swapAddress => getOneInchCall(swapAddress)
      : (marketPrice, precision) => oneInchCallMock(marketPrice, precision),
  }

  async function getDpm(): Promise<{ proxy: string; vaultId: number }> {
    const [proxy, vaultId] = await createDPMAccount(system.common.accountFactory)
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
    strategiesDependencies: dependencies,
    dsProxy: system.common.userProxyAddress,
    dpmAccounts: [dpm1, dpm2, dpm3, dpm4],
    getTokens,
  }
}
