import { loadContractNames } from '@deploy-configurations/constants'
import type { System } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry as OperationRegistryWrapper } from '@deploy-configurations/utils/wrappers'
import { showConsoleLogs } from '@dma-common/test-utils/console'
import { getOrCreateProxy } from '@dma-common/utils/proxy'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import {
  DSProxy,
  FakeDAI,
  FakeUSDC,
  FakeUSDT,
  FakeWBTC,
  FakeWETH,
  FakeWSTETH,
} from '@dma-contracts/typechain'
import { utils } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type TestHelpers = {
  userProxy: DSProxy
  fakeWETH: FakeWETH
  fakeDAI: FakeDAI
  fakeUSDT: FakeUSDT
  fakeWBTC: FakeWBTC
  fakeWSTETH: FakeWSTETH
  fakeUSDC: FakeUSDC
}

export type TestDeploymentSystem = {
  deployment: System
  helpers: TestHelpers
  extraDeployment?: any
}

export type PostDeploymentFunction = (
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers,
  extraDeployment: any,
) => Promise<any>

export const DefaultPostDeploymentFunctions = [
  postDeploymentTestOperations,
  postDeploymentMockExchange,
  postDeploymentSystemOverrides,
]

export async function deployTestSystem(
  hre: HardhatRuntimeEnvironment,
  postDeploymentFunctions: PostDeploymentFunction[] = DefaultPostDeploymentFunctions,
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
  await ds.loadConfig('test.conf')
  await ds.deployAll()

  const helpers = await deployTestHelpers(hre, ds)

  let extraDeployment: any = {}

  postDeploymentFunctions.forEach(async postDeploymentFunction => {
    extraDeployment = await postDeploymentFunction(hre, ds, helpers, extraDeployment)
  })

  await ds.addAllEntries()

  showConsoleLogs(true)

  return {
    deployment: ds.getSystem(),
    helpers,
    extraDeployment,
  }
}

async function deployTestHelpers(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
): Promise<TestHelpers> {
  // Fake WETH
  const fakeWETH = (await ds.deployContractByName('FakeWETH', [])) as FakeWETH

  // Fake DAI
  const fakeDAI = (await ds.deployContractByName('FakeDAI', [])) as FakeDAI

  // Fake USDT
  const fakeUSDT = (await ds.deployContractByName('FakeUSDT', [])) as FakeUSDT

  // Fake WBTC
  const fakeWBTC = (await ds.deployContractByName('FakeWBTC', [])) as FakeWBTC

  // Fake WSTETH
  const fakeWSTETH = (await ds.deployContractByName('FakeWSTETH', [])) as FakeWSTETH

  // Fake USDC
  const fakeUSDC = (await ds.deployContractByName('FakeUSDC', [])) as FakeUSDC

  // User proxy
  const userProxy: DSProxy = (await getOrCreateProxy(
    ds.getSystem().system.DSProxyRegistry.contract,
    ds.signer,
  )) as DSProxy

  return {
    userProxy,
    fakeWETH,
    fakeDAI,
    fakeUSDT,
    fakeWBTC,
    fakeWSTETH,
    fakeUSDC,
  }
}

async function postDeploymentTestOperations(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers,
  extraDeployment: any,
): Promise<any> {
  const testDeploymentSystem = ds.getSystem()
  const signer = hre.ethers.provider.getSigner()

  const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)

  // Test Operation
  const operationsRegistry = new OperationRegistryWrapper(
    testDeploymentSystem.system.OperationsRegistry.contract.address,
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

  await operationsRegistry.addOp('ALL_OPTIONAL_OPERATION', [
    { hash: Action1Hash, optional: true },
    { hash: Action2Hash, optional: true },
    { hash: Action3Hash, optional: true },
  ])
}

async function postDeploymentMockExchange(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers,
  extraDeployment: any,
): Promise<any> {
  const testDeploymentSystem = ds.getSystem()

  const mockExchange = testDeploymentSystem.system.MockExchange.contract

  // Mint fake tokens for the mock exchange
  await helpers.fakeWETH.mint(mockExchange.address, utils.parseEther('1000000000'))
  await helpers.fakeDAI.mint(mockExchange.address, utils.parseEther('1000000000'))
  await helpers.fakeUSDT.mint(mockExchange.address, utils.parseUnits('1000000000', 6))
  await helpers.fakeWBTC.mint(mockExchange.address, utils.parseUnits('1000000000', 8))
  await helpers.fakeWSTETH.mint(mockExchange.address, utils.parseEther('1000000000'))
  await helpers.fakeUSDC.mint(mockExchange.address, utils.parseUnits('1000000000', 6))

  // Set sensible price for DAI and WETH
  await mockExchange.setPrice(helpers.fakeWETH.address, utils.parseEther('1800'))
  await mockExchange.setPrice(helpers.fakeDAI.address, utils.parseEther('1'))
  await mockExchange.setPrice(helpers.fakeUSDT.address, utils.parseEther('1'))
  await mockExchange.setPrice(helpers.fakeWBTC.address, utils.parseEther('31000'))
  await mockExchange.setPrice(helpers.fakeWSTETH.address, utils.parseEther('1800'))
  await mockExchange.setPrice(helpers.fakeUSDC.address, utils.parseEther('1'))
}

async function postDeploymentSystemOverrides(
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
  helpers: TestHelpers,
  extraDeployment: any,
): Promise<any> {
  const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)

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
}
