import { loadContractNames } from '@deploy-configurations/constants'
import type { System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry as OperationRegistryWrapper } from '@deploy-configurations/utils/wrappers'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { DSProxy, FakeDAI, FakeWETH } from '@dma-contracts/typechain'
import { utils } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { showConsoleLogs } from './console'

export type TestHelpers = {
  userProxy: DSProxy
  fakeWETH: FakeWETH
  fakeDAI: FakeDAI
}

export type TestDeploymentSystem = {
  deployment: System
  helpers: TestHelpers
}

export async function deployTestSystem(
  hre: HardhatRuntimeEnvironment,
  showLogs = false,
  useFallbackSwap = true,
): Promise<TestDeploymentSystem> {
  showConsoleLogs(showLogs)

  const ethers = hre.ethers
  const provider = ethers.provider
  const signer = provider.getSigner()
  const signerAddress = await signer.getAddress()
  const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)

  console.log('-----------------------------')
  console.log('    Deployment System')
  console.log('-----------------------------')
  console.log(`Deployer Address: ${signerAddress}`)
  console.log(`Using Fallback Swap: ${useFallbackSwap}`)
  console.log('-----------------------------')

  // Deploy mocks

  const ds = new DeploymentSystem(hre)
  await ds.init()
  await ds.loadConfig('test.conf')
  await ds.deployAll()

  // Override OneInchAggregator with the MockExchange
  const mockExchangeAddress = ds.getSystem().system.MockExchange.contract.address
  ds.addConfigOverrides({
    common: {
      OneInchAggregator: {
        name: 'OneInchAggregator',
        address: mockExchangeAddress,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR,
      },
    },
  })

  await ds.addAllEntries()

  const deployment = ds.getSystem()

  // User Proxy
  const userProxy: DSProxy = await getOrCreateProxy(
    deployment.system.DSProxyRegistry.contract,
    ds.signer,
  )

  // Test Operation
  const operationsRegistry = new OperationRegistryWrapper(
    deployment.system.OperationsRegistry.contract.address,
    signer,
  )

  const Action1Hash = utils.keccak256(utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_ACTION))
  const Action2Hash = utils.keccak256(
    utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_OPTIONAL_ACTION),
  )
  const Action3Hash = utils.keccak256(utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_ACTION))

  await operationsRegistry.addOp('TEST_OPERATION_1', [
    { hash: Action1Hash, optional: false },
    { hash: Action2Hash, optional: true },
    { hash: Action3Hash, optional: false },
  ])

  // Fake WETH
  const fakeWETH = (await ds.deployContractByName('FakeWETH', [])) as FakeWETH

  // Fake DAI
  const fakeDAI = (await ds.deployContractByName('FakeDAI', [])) as FakeDAI

  // Mint DAI and WETH to MockExchange
  await fakeWETH.mint(
    deployment.system.MockExchange.contract.address,
    utils.parseEther('1000000000'),
  )
  await fakeDAI.mint(
    deployment.system.MockExchange.contract.address,
    utils.parseEther('1000000000'),
  )

  // Set sensible price for DAI and WETH
  await deployment.system.MockExchange.contract.setPrice(fakeWETH.address, utils.parseEther('1800'))
  await deployment.system.MockExchange.contract.setPrice(fakeDAI.address, utils.parseEther('1'))

  showConsoleLogs(true)

  return {
    deployment,
    helpers: {
      userProxy,
      fakeWETH,
      fakeDAI,
    },
  }
}
