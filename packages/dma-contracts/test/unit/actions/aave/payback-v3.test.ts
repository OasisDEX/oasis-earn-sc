import { FakeContract, smock } from '@defi-wonderland/smock'
import { JsonRpcProvider } from '@ethersproject/providers'
import AavePoolAbi from '@oasisdex/abis/external/protocols/aave/v3/pool.json'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { createDeploy } from '@oasisdex/dma-common/utils/deploy'
import init from '@oasisdex/dma-common/utils/init'
import { ServiceRegistry } from '@oasisdex/dma-common/utils/wrappers/service-registry'
import { calldataTypes } from '@oasisdex/dma-library'
import { Pool } from '@typechain/abis/external/protocols/aave/v3/Pool'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const utils = ethers.utils
chai.use(smock.matchers)

const defaultDebtRateMode = 2
describe('AAVE | PaybackV3 Action | Unit', () => {
  let provider: JsonRpcProvider
  let paybackV3Action: Contract
  let paybackV3ActionAddress: string
  let snapshotId: string
  let fakePool: FakeContract<Pool>

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

    fakePool = await smock.fake<Pool>(AavePoolAbi)
    fakePool.repay.returns()

    await registry.addEntry(CONTRACT_NAMES.aave.v3.AAVE_POOL, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

    const [_paybackV3Action, _paybackV3ActionAddress] = await deploy('AaveV3Payback', [
      serviceRegistryAddress,
    ])
    paybackV3Action = _paybackV3Action
    paybackV3ActionAddress = _paybackV3ActionAddress
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    await paybackV3Action.execute(
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
})
