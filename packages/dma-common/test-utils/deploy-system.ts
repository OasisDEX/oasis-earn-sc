import type { System } from '@deploy-configurations/types/deployed-system'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { DSProxy, DummyAction, DummyExchange, DummyOptionalAction } from '@dma-contracts/typechain'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { showConsoleLogs } from './console'

export type TestDeploymentSystem = {
  deployment: System
  userProxy: DSProxy
  dummyAction: DummyAction
  dummyOptionalAction: DummyOptionalAction
  dummyExchange: DummyExchange
}

export async function deploySystem(
  hre: HardhatRuntimeEnvironment,
  showLogs = false,
  useFallbackSwap = true,
): Promise<TestDeploymentSystem> {
  showConsoleLogs(showLogs)

  const ethers = hre.ethers
  const provider = ethers.provider
  const signer = provider.getSigner()
  const signerAddress = await signer.getAddress()

  console.log('-----------------------------')
  console.log('    Deployment System')
  console.log('-----------------------------')
  console.log(`Deployer Address: ${signerAddress}`)
  console.log(`Using Fallback Swap: ${useFallbackSwap}`)
  console.log('-----------------------------')

  const ds = new DeploymentSystem(hre)
  await ds.init()
  await ds.loadConfig()
  await ds.deployAll()

  const deployment = ds.getSystem()

  const userProxy: DSProxy = await getOrCreateProxy(
    deployment.system.DSProxyRegistry.contract,
    ds.signer,
  )

  // DUMMY ACTION
  const dummyAction = await ds.deployContractByName<DummyAction>('DummyAction', [
    deployment.system.ServiceRegistry.contract.address,
  ])
  const dummyOptionalAction = await ds.deployContractByName<DummyOptionalAction>(
    'DummyOptionalAction',
    [deployment.system.ServiceRegistry.contract.address],
  )
  const dummyExchange = await ds.deployContractByName<DummyExchange>('DummyExchange', [])

  // DUMMY EXCHANGE
  // await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)
  // const [dummyAutomation] = await deploy('DummyAutomation', [serviceRegistryAddress])
  // const [dummyCommmand] = await deploy('DummyCommand', [serviceRegistryAddress])

  showConsoleLogs(true)

  return {
    deployment,
    userProxy,
    dummyAction,
    dummyOptionalAction,
    dummyExchange,
  }
}
