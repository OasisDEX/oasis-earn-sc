import { JsonRpcProvider } from '@ethersproject/providers'
import { ActionFactory, calldataTypes, CONTRACT_NAMES } from '@oasisdex/oasis-actions'
import { ActionCall } from '@oasisdex/oasis-actions/src/types'
import { expect } from 'chai'
import { ContractReceipt, Signer, utils } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import DummyActionABI from '../../abi/generated/DummyAction.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { RuntimeConfig } from '../../helpers/types/common'
import { OperationsRegistry } from '../../helpers/wrappers/operationsRegistry'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'

const createAction = ActionFactory.create

const dummyActionIface = new ethers.utils.Interface(DummyActionABI)

async function executeOperation(
  system: DeployedSystemInfo,
  calls: ActionCall[],
  operationName: string,
  signer: Signer,
) {
  const result = await executeThroughProxy(
    system.common.userProxyAddress,
    {
      address: system.common.operationExecutor.address,
      calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
        calls,
        operationName,
      ]),
    },
    signer,
    '0',
  )
  return result
}

function getContractLogs(iface: Interface, receipt: ContractReceipt) {
  const logs: any = []

  receipt.events?.forEach(event => {
    try {
      logs.push(iface.parseLog(event))
    } catch (e) {
      //eslint-disable-next-line
    }
  })

  return logs
}

describe(`Optional Actions`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let system: DeployedSystemInfo
  let config: RuntimeConfig
  let operationsRegistry: OperationsRegistry
  let OPERATION_NAME: string
  let Action1Hash: string
  let Action2Hash: string
  let Action3Hash: string
  let action1: ActionCall
  let action2: ActionCall
  let action3: ActionCall

  beforeEach(async () => {
    ;({ config, provider, signer } = await initialiseConfig())

    const { snapshot } = await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
    system = snapshot.deployed.system

    operationsRegistry = new OperationsRegistry(system.common.operationRegistry.address, signer)

    // Add new operation with optional Actions
    OPERATION_NAME = 'TEST_OPERATION_1'
    Action1Hash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.test.DUMMY_ACTION))
    Action2Hash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION))
    Action3Hash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.test.DUMMY_ACTION))

    await operationsRegistry.addOp(OPERATION_NAME, [
      { hash: Action1Hash, optional: false },
      { hash: Action2Hash, optional: true },
      {
        hash: Action3Hash,
        optional: false,
      },
    ])

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
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
  })

  describe(`New operation added to OperationRegistry`, async () => {
    it(`should add new operation succesfully`, async () => {
      const OP_NAME = 'TEST_OPERATION_2'
      await operationsRegistry.addOp(OP_NAME, [
        { hash: Action1Hash, optional: true },
        { hash: Action2Hash, optional: false },
        {
          hash: Action3Hash,
          optional: false,
        },
      ])

      const operation = await operationsRegistry.getOp(OP_NAME)

      expect(operation[0]).to.deep.equal([Action1Hash, Action2Hash, Action3Hash])
      expect(operation[1]).to.deep.equal([false, false, false])
    })
  })

  describe(`Regular Operation successful`, async () => {
    it(`should execute an Operation successfully`, async () => {
      const [success, rc] = await executeOperation(
        system,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      const actionLogs = getContractLogs(dummyActionIface, rc)

      expect(success).to.be.eq(true)
      expect(actionLogs.length).to.be.eq(3)
      expect(actionLogs[0].args[0].hash).to.be.eq(
        ethers.utils.keccak256(utils.toUtf8Bytes('DummyActionEvent')),
      )
      expect(actionLogs[1].args[0].hash).to.be.eq(
        ethers.utils.keccak256(utils.toUtf8Bytes('DummyOptionalActionEvent')),
      )
      expect(actionLogs[2].args[0].hash).to.be.eq(
        ethers.utils.keccak256(utils.toUtf8Bytes('DummyActionEvent')),
      )
    })
  })

  describe(`Operation with skipped Action successful`, async () => {
    it(`should execute an Operation successfully with optional Action skipped`, async () => {
      action2.skipped = true

      const [success, rc] = await executeOperation(
        system,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      const actionLogs = getContractLogs(dummyActionIface, rc)

      expect(success).to.be.eq(true)
      expect(actionLogs.length).to.be.eq(2)
      expect(actionLogs[0].args[0].hash).to.be.eq(
        ethers.utils.keccak256(utils.toUtf8Bytes('DummyActionEvent')),
      )
      expect(actionLogs[1].args[0].hash).to.be.eq(
        ethers.utils.keccak256(utils.toUtf8Bytes('DummyActionEvent')),
      )
    })
  })

  describe(`Operation with mandatory Action skipped`, async () => {
    it(`should fail executing an Operation with mandatory Action skipped`, async () => {
      action3.skipped = true

      const [success] = await executeOperation(
        system,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      expect(success).to.be.eq(false)
    })
  })
})
