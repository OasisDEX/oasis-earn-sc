import { FakeContract, smock } from '@defi-wonderland/smock'
import { JsonRpcProvider } from '@ethersproject/providers'
import { calldataTypes, CONTRACT_NAMES } from '@oasisdex/oasis-actions/src'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import AavePoolAbi from '../../../abi/external/aave/v3/pool.json'
import { createDeploy } from '../../../helpers/deploy'
import init from '../../../helpers/init'
import { ServiceRegistry } from '../../../helpers/serviceRegistry'
import { Pool } from '../../../typechain'

const utils = ethers.utils
chai.use(smock.matchers)

describe('AAVE | WithdrawV3 Action', () => {
  let provider: JsonRpcProvider
  let withdrawV3Action: Contract
  let snapshotId: string
  let fakePool: FakeContract<Pool>
  let tx: any

  const expectedValues = {
    asset: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    amount: 1000,
    to: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
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
    fakePool.withdraw.returns(expectedValues.amount)

    await registry.addEntry(CONTRACT_NAMES.aave.v3.AAVE_POOL, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

    const [_withdrawV3Action] = await deploy('AaveV3Withdraw', [serviceRegistryAddress])
    withdrawV3Action = _withdrawV3Action
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    tx = await withdrawV3Action.execute(
      utils.defaultAbiCoder.encode([calldataTypes.aaveV3.Withdraw], [expectedValues]),
      [0, 0],
    )
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should call Withdraw on AAVE V3 Pool with expected params', async () => {
    expect(fakePool.withdraw).to.be.calledWith(
      expectedValues.asset,
      expectedValues.amount,
      expectedValues.to,
    )
  })
  it('should emit Withdraw V3 Action event', async () => {
    const expectedActionName = 'AaveV3Withdraw'
    const expectedEventName = 'Action'
    const abi = ['event Action (string indexed name, bytes returned)']
    const iface = new utils.Interface(abi)
    const txReceipt = await (await tx).wait()
    const parsedLog = iface.parseLog(txReceipt.logs[0])

    expect(expectedEventName).to.equal(parsedLog.name)
    expect(utils.keccak256(utils.toUtf8Bytes(expectedActionName))).to.equal(parsedLog.args[0].hash)
    expect(utils.defaultAbiCoder.encode(['uint256'], [expectedValues.amount])).to.equal(
      parsedLog.args[1],
    )
  })
})
