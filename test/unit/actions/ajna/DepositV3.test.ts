import AjnaPoolAbi from '@abi/external/ajna/ajnaPoolERC20.json'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { JsonRpcProvider } from '@ethersproject/providers'
import { createDeploy } from '@helpers/deploy'
import init from '@helpers/init'
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { calldataTypes, CONTRACT_NAMES } from '@oasisdex/oasis-actions'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import { AjnaPoolERC20 } from '../../../../typechain'

const utils = ethers.utils
chai.use(smock.matchers)

const defaultReferralCodeInAction = 0
describe('AAVE | DepositV3 Action', () => {
  let provider: JsonRpcProvider
  let depositV3Action: Contract
  let depositV3ActionAddress: string
  let snapshotId: string
  let fakePool: FakeContract<AjnaPoolERC20>
  let tx: any

  const expectedValues = {
    asset: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    amount: 1000,
    sumAmounts: false,
    setAsCollateral: false,
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

    fakePool = await smock.fake<AjnaPoolERC20>(AjnaPoolAbi)
    fakePool.drawDebt.returns()

    await registry.addEntry(CONTRACT_NAMES.ajna.AJNA_POOL_UTILS_INFO, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

    const [_depositV3Action, _depositV3ActionAddress] = await deploy('AaveV3Deposit', [
      serviceRegistryAddress,
    ])
    depositV3Action = _depositV3Action
    depositV3ActionAddress = _depositV3ActionAddress
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    tx = await depositV3Action.execute(
      utils.defaultAbiCoder.encode([calldataTypes.aaveV3.Deposit], [expectedValues]),
      [0, 0],
    )
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should call deposit on AAVE V3 Pool with expected params', async () => {
    expect(fakePool.supply).to.be.calledWith(
      expectedValues.asset,
      expectedValues.amount,
      depositV3ActionAddress,
      defaultReferralCodeInAction,
    )
  })
  it('should emit Deposit V3 Action event', async () => {
    const expectedActionName = 'AaveV3Deposit'
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
  it('should call set collateral when flag is passed', async () => {
    const expectedValues = {
      asset: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      amount: 1000,
      sumAmounts: false,
      setAsCollateral: true,
    }

    await depositV3Action.execute(
      utils.defaultAbiCoder.encode([calldataTypes.aaveV3.Deposit], [expectedValues]),
      [0, 0],
    )

    expect(fakePool.setUserUseReserveAsCollateral).to.be.calledWith(
      expectedValues.asset,
      expectedValues.setAsCollateral,
    )
  })
})
