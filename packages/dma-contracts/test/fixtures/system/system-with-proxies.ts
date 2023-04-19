import init, { resetNode } from '@dma-common/utils/init'
import { mainnetAddresses } from '@dma-contracts/test/addresses'
import { testBlockNumber } from '@dma-contracts/test/config'
import { buildGetTokenByImpersonateFunction } from '@dma-contracts/test/utils/aave'
import { createDPMAccount, deploySystem } from '@oasisdex/dma-common/test-utils'
import { getOneInchCall, oneInchCallMock } from '@oasisdex/dma-common/utils/swap'
import { AaveVersion, protocols, strategies } from '@oasisdex/dma-library'

import { StrategiesDependencies, SystemWithProxies } from '../types'

export async function systemWithProxies({
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
