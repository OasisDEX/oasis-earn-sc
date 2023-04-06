import AavePoolAbi from '@oasisdex/dma-contracts/abi/external/aave/v3/pool.json'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { JsonRpcProvider } from '@ethersproject/providers'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { Pool } from '@oasisdex/dma-contracts/typechain/abi/external/aave/v3/Pool'
import init from '@oasisdex/dma-common/utils/init'
import { createDeploy } from '@oasisdex/dma-common/utils/deploy'
import { ServiceRegistry } from '@dma-library/test/utils'
import { calldataTypes } from '@dma-library'
import { CONTRACT_NAMES } from '@dma-library/utils/constants'

const utils = ethers.utils
chai.use(smock.matchers)

describe('AAVE | SetEModeV3 Action', () => {
  let provider: JsonRpcProvider
  let setEModeV3Action: Contract
  let snapshotId: string
  let fakePool: FakeContract<Pool>
  let tx: any

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

    tx = await setEModeV3Action.execute(
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
  it('should emit SetEMode V3 Action event', async () => {
    const expectedActionName = 'AaveV3SetEMode'
    const expectedEventName = 'Action'
    const abi = ['event Action (string indexed name, bytes returned)']
    const iface = new utils.Interface(abi)
    const txReceipt = await (await tx).wait()
    const parsedLog = iface.parseLog(txReceipt.logs[0])

    expect(expectedEventName).to.equal(parsedLog.name)
    expect(utils.keccak256(utils.toUtf8Bytes(expectedActionName))).to.equal(parsedLog.args[0].hash)
    expect(utils.defaultAbiCoder.encode(['uint256'], [expectedValues.categoryId])).to.equal(
      parsedLog.args[1],
    )
  })
})
