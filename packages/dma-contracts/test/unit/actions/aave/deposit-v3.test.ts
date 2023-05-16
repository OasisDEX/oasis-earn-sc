import AavePoolAbi from '@abis/external/protocols/aave/v3/pool.json'
import { FakeContract, smock } from '@defi-wonderland/smock'
import { CONTRACT_NAMES } from '@deploy-configurations/constants'
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

const defaultReferralCodeInAction = 0
describe('AAVE | DepositV3 Action | Unit', () => {
  let provider: JsonRpcProvider
  let depositV3Action: Contract
  let depositV3ActionAddress: string
  let snapshotId: string
  let fakePool: FakeContract<Pool>

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

    fakePool = await smock.fake<Pool>(AavePoolAbi)
    fakePool.supply.returns()

    await registry.addEntry(CONTRACT_NAMES.aave.v3.AAVE_POOL, fakePool.address)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)

    const [_depositV3Action, _depositV3ActionAddress] = await deploy('AaveV3Deposit', [
      serviceRegistryAddress,
    ])
    depositV3Action = _depositV3Action
    depositV3ActionAddress = _depositV3ActionAddress
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])

    await depositV3Action.execute(
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
