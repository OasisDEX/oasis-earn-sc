import AavePoolAbi from '@abis/external/protocols/aave/v3/pool.json'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { loadContractNames } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { calldataTypes } from '@dma-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Pool } from '@typechain/abis/external/protocols/aave/v3/Pool'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const utils = ethers.utils
chai.use(smock.matchers)
const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

describe('AAVE | SetEModeV3 Action | Unit', () => {
  let provider: JsonRpcProvider
  let setEModeV3Action: Contract
  let snapshotId: string
  let fakePool: FakeContract<Pool>

  const expectedValues = {
    categoryId: 1,
  }

  before(async () => {
    const config = await init()
    provider = config.provider
    const signer = config.signer

    const deploy = await createDeploy({ config })
    const delay = 0
    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [delay])
    const registry = new ServiceRegistry(serviceRegistryAddress, signer)
    const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])
    const [, operationExecutorAddress] = await deploy('OperationExecutor', [
      serviceRegistryAddress,
      operationsRegistryAddress,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
    ])
    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])

    fakePool = await smock.fake<Pool>(AavePoolAbi)
    fakePool.setUserEMode.returns()

    await registry.addEntry(SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL, fakePool.address)
    await registry.addEntry(
      SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
      operationStorageAddress,
    )

    const [_setEModeV3Action] = await deploy('AaveV3SetEMode', [serviceRegistryAddress])
    setEModeV3Action = _setEModeV3Action
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    await setEModeV3Action.execute(
      utils.defaultAbiCoder.encode([calldataTypes.aaveV3.SetEMode], [expectedValues]),
      [0, 0],
    )
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should call setUserEMode on AAVE V3 Pool with expected params', async () => {
    expect(fakePool.setUserEMode).to.be.calledWith(expectedValues.categoryId)
  })
})
