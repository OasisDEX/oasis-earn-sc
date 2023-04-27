import AavePoolAbi from '@abis/external/protocols/aave/v3/pool.json'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { createDeploy } from '@dma-common/utils/deploy'
import init from '@dma-common/utils/init'
import { ServiceRegistry } from '@dma-deployments/utils/wrappers'
import { calldataTypes } from '@dma-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { Pool } from '@typechain/abis/external/protocols/aave/v3/Pool'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const utils = ethers.utils
chai.use(smock.matchers)

describe('AAVE | WithdrawV3 Action | Unit', () => {
  let provider: JsonRpcProvider
  let withdrawV3Action: Contract
  let snapshotId: string
  let fakePool: FakeContract<Pool>

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

    await withdrawV3Action.execute(
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
})
