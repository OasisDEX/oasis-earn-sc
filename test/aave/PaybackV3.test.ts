import { FakeContract, smock } from '@defi-wonderland/smock'
import { JsonRpcProvider } from '@ethersproject/providers'
import { calldataTypes, CONTRACT_NAMES } from '@oasisdex/oasis-actions/src'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import AavePoolAbi from '../../abi/external/aave/v3/pool.json'
import { createDeploy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { AaveV3Pool } from '../../typechain/abi/external/AaveV3Pool'

const utils = ethers.utils
chai.use(smock.matchers)

const defaultDebtRateMode = 2
describe('AAVE | PaybackA3 Action', () => {
  let provider: JsonRpcProvider
  let paybackV3Action: Contract
  let paybackV3ActionAddress: string
  let snapshotId: string
  let fakePool: FakeContract<AaveV3Pool>
  let tx: any

  const expectedValues = {
    asset: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    amount: 1000,
    paybackAll: false,
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

    fakePool = await smock.fake<AaveV3Pool>(AavePoolAbi)
    fakePool.repay.returns()

    await registry.addEntry(CONTRACT_NAMES.aaveV3.AAVE_POOL, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

    const [_paybackV3Action, _paybackV3ActionAddress] = await deploy('AaveV3Payback', [
      serviceRegistryAddress,
    ])
    paybackV3Action = _paybackV3Action
    paybackV3ActionAddress = _paybackV3ActionAddress
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    tx = await paybackV3Action.execute(
      utils.defaultAbiCoder.encode([calldataTypes.aaveV3.Payback], [expectedValues]),
      [0, 0],
    )
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should call repay on AAVE V3 Pool with expected params', async () => {
    expect(fakePool.repay).to.be.calledWith(
      expectedValues.asset,
      expectedValues.amount,
      defaultDebtRateMode,
      paybackV3ActionAddress,
    )
  })
  it('should call repay on AAVE V3 Pool with max uint when paybackAll flag passed', async () => {
    await paybackV3Action.execute(
      utils.defaultAbiCoder.encode(
        [calldataTypes.aaveV3.Payback],
        [{ ...expectedValues, paybackAll: true }],
      ),
      [0, 0],
    )

    expect(fakePool.repay).to.be.calledWith(
      expectedValues.asset,
      ethers.constants.MaxUint256,
      defaultDebtRateMode,
      paybackV3ActionAddress,
    )
  })
  it('should emit Payback V3 Action event', async () => {
    const expectedActionName = 'AaveV3Payback'
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
