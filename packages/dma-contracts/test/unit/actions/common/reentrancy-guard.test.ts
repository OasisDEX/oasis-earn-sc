import { loadContractNames } from '@deploy-configurations/constants'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot } from '@dma-contracts/utils'
import { ActionCall, ActionFactory, calldataTypes } from '@dma-library'
import { DsProxy } from '@typechain'
import { Signer, utils } from 'ethers'
import hre, { ethers } from 'hardhat'

const createAction = ActionFactory.create

describe(`Reentrancy guard test | Unit`, async () => {
  let signer: Signer
  let system: DeployedSystem
  let userProxy: DsProxy
  const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)
  let OPERATION_NAME: string
  let Action1Hash: string
  let Action2Hash: string
  let Action3Hash: string
  let action1: ActionCall
  let action2: ActionCall
  let action3: ActionCall

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({ hre, blockNumber: testBlockNumber })
    system = snapshot.testSystem.deployment.system
    userProxy = snapshot.testSystem.helpers.userProxy
    signer = snapshot.config.signer

    OPERATION_NAME = 'ALL_OPTIONAL_OPERATION'
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it(`should execute an action, even if OperationStorage lock() was called by another address`, async () => {
    Action1Hash = utils.keccak256(utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_ACTION))
    Action2Hash = utils.keccak256(
      utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_OPTIONAL_ACTION),
    )
    Action3Hash = utils.keccak256(utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.test.DUMMY_ACTION))

    action1 = createAction(
      Action1Hash,
      ['tuple(address to)', calldataTypes.paramsMap],
      [{ to: ethers.constants.AddressZero }, [0]],
    )
    action2 = createAction(
      Action2Hash,
      ['tuple(address to)', calldataTypes.paramsMap],
      [{ to: ethers.constants.AddressZero }, [0]],
    )
    action3 = createAction(
      Action3Hash,
      ['tuple(address to)', calldataTypes.paramsMap],
      [{ to: ethers.constants.AddressZero }, [0]],
    )

    // LOCK OperationStorage before operation execution
    await system.OperationStorage.contract.lock()

    const [success] = await executeThroughProxy(
      userProxy.address,
      {
        address: system.OperationExecutor.contract.address,
        calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
          [action1, action2, action3],
          OPERATION_NAME,
        ]),
      },
      signer,
    )

    expect(success).to.be.eq(true)
  })
})
