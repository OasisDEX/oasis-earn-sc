import DummyActionABI from '@abis/system/contracts/test/DummyAction.sol/DummyAction.json'
import { loadContractNames } from '@deploy-configurations/constants'
import { OperationsRegistry as OperationRegistryWrapper } from '@deploy-configurations/utils/wrappers'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { testBlockNumber } from '@dma-contracts/test/config'
import { restoreSnapshot, TestDeploymentSystem } from '@dma-contracts/utils'
import { ActionCall, ActionFactory, calldataTypes, Network } from '@dma-library'
import { expect } from 'chai'
import { ContractReceipt, Signer, utils } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import hre, { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const createAction = ActionFactory.create
const SERVICE_REGISTRY_NAMES = loadContractNames(Network.TEST)

const dummyActionIface = new ethers.utils.Interface(DummyActionABI)

async function executeOperation(
  hre: HardhatRuntimeEnvironment,
  testSystem: TestDeploymentSystem,
  calls: ActionCall[],
  operationName: string,
  signer: Signer,
) {
  const result = await executeThroughProxy(
    testSystem.helpers.userProxy.address,
    {
      address: testSystem.deployment.system.OperationExecutor.contract.address,
      calldata:
        testSystem.deployment.system.OperationExecutor.contract.interface.encodeFunctionData(
          'executeOp',
          [calls, operationName],
        ),
    },
    signer,
    '0',
    hre,
    false,
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

describe(`Optional Actions | Unit`, async () => {
  let signer: Signer
  let testSystem: TestDeploymentSystem
  let operationsRegistry: OperationRegistryWrapper
  let OPERATION_NAME: string
  let Action1Hash: string
  let Action2Hash: string
  let Action3Hash: string
  let action1: ActionCall
  let action2: ActionCall
  let action3: ActionCall

  beforeEach(async () => {
    const { snapshot } = await restoreSnapshot({
      hre,
      blockNumber: testBlockNumber,
    })
    testSystem = snapshot.testSystem
    signer = snapshot.config.signer

    operationsRegistry = new OperationRegistryWrapper(
      testSystem.deployment.system.OperationsRegistry.contract.address,
      signer,
    )

    // Prepare the test operation
    OPERATION_NAME = 'TEST_OPERATION_1'
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
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  describe(`New operation added to OperationRegistry`, async () => {
    it(`should add new operation succesfully`, async () => {
      const OP_NAME = 'TEST_OPERATION_2'
      await operationsRegistry.addOp(OP_NAME, [
        { hash: Action1Hash, optional: true },
        { hash: Action2Hash, optional: false },
        { hash: Action3Hash, optional: false },
      ])

      const operation = await operationsRegistry.getOp(OP_NAME)

      expect(operation[0]).to.deep.equal([Action1Hash, Action2Hash, Action3Hash])
      expect(operation[1]).to.deep.equal([true, false, false])
    })
  })

  describe(`Regular Operation successful`, async () => {
    it(`should execute an Operation successfully`, async () => {
      operationsRegistry
      const [success, rc] = await executeOperation(
        hre,
        testSystem,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      const dummyActionLogs = getContractLogs(
        testSystem.deployment.system.DummyAction.contract.interface,
        rc,
      )
      const dummyOptionalActionLogs = getContractLogs(
        testSystem.deployment.system.DummyOptionalAction.contract.interface,
        rc,
      )

      expect(success).to.be.eq(true)
      expect(dummyActionLogs.length).to.be.eq(2)

      console.log(dummyActionLogs[0].name)
      expect(dummyActionLogs[0].name).to.be.eq('DummyActionEvent')
      expect(dummyActionLogs[1].name).to.be.eq('DummyActionEvent')

      expect(dummyOptionalActionLogs.length).to.be.eq(1)
      expect(dummyOptionalActionLogs[0].name).to.be.eq('DummyOptionalActionEvent')
    })
  })

  describe(`Operation with skipped Action successful`, async () => {
    it(`should execute an Operation successfully with optional Action skipped`, async () => {
      action2.skipped = true

      const [success, rc] = await executeOperation(
        hre,
        testSystem,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      const dummyActionLogs = getContractLogs(dummyActionIface, rc)
      const dummyOptionalActionLogs = getContractLogs(
        testSystem.deployment.system.DummyOptionalAction.contract.interface,
        rc,
      )

      expect(success).to.be.eq(true)

      expect(dummyActionLogs.length).to.be.eq(2)
      expect(dummyActionLogs[0].name).to.be.eq('DummyActionEvent')
      expect(dummyActionLogs[1].name).to.be.eq('DummyActionEvent')

      expect(dummyOptionalActionLogs.length).to.be.eq(0)
    })
  })

  describe(`Operation with mandatory Action skipped`, async () => {
    it(`should fail executing an Operation with mandatory Action skipped`, async () => {
      action3.skipped = true

      const [success] = await executeOperation(
        hre,
        testSystem,
        [action1, action2, action3],
        OPERATION_NAME,
        signer,
      )

      expect(success).to.be.eq(false)
    })
  })
})
