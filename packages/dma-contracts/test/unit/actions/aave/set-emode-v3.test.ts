import { FakeContract, smock } from '@defi-wonderland/smock'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { JsonRpcProvider } from '@ethersproject/providers'
import AavePoolAbi from '@oasisdex/abis/external/protocols/aave/v3/pool.json'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { ServiceRegistry } from '@oasisdex/dma-deployments/utils/wrappers'
import { calldataTypes } from '@oasisdex/dma-library'
import { Pool } from '@typechain/abis/external/protocols/aave/v3/Pool'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const utils = ethers.utils
chai.use(smock.matchers)

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
    const [, operationExecutorAddress] = await deploy('OperationExecutor', [serviceRegistryAddress])
    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])

    fakePool = await smock.fake<Pool>(AavePoolAbi)
    fakePool.setUserEMode.returns()

    await registry.addEntry(CONTRACT_NAMES.aave.v3.AAVE_POOL, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

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