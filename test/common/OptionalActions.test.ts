import { JsonRpcProvider } from '@ethersproject/providers'
import { ActionFactory, ADDRESSES, calldataTypes, CONTRACT_NAMES } from '@oasisdex/oasis-actions'
import { ActionCall } from '@oasisdex/oasis-actions/src/actions/types/actionCall'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Signer, utils } from 'ethers'

import { executeThroughProxy } from '../../helpers/deploy'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig } from '../../helpers/types/common'
import { OperationsRegistry } from '../../helpers/wrappers/operationsRegistry'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'

const createAction = ActionFactory.create

async function executeOperation(
  system: DeployedSystemInfo,
  calls: ActionCall[],
  operationName: string,
  signer: Signer,
  wrapAmount: BigNumber,
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [success, _] = await executeThroughProxy(
    system.common.userProxyAddress,
    {
      address: system.common.operationExecutor.address,
      calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
        calls,
        operationName,
      ]),
    },
    signer,
    wrapAmount.toString(),
  )

  return success
}
describe(`Common | Optional Actions`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let system: DeployedSystemInfo
  let config: RuntimeConfig
  let operationsRegistry: OperationsRegistry
  let wrapAmount: BigNumber
  let OPERATION_NAME: string
  let OpenVaultHash: string
  let WrapEthHash: string
  let setApprovalHash: string
  let openVaultAction: ActionCall
  let wrapEthAction: ActionCall
  let setApprovalAction: ActionCall

  beforeEach(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    const { snapshot } = await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
    system = snapshot.deployed.system

    wrapAmount = new BigNumber(10000)
    operationsRegistry = new OperationsRegistry(system.common.operationRegistry.address, signer)

    // Add new operation with optional Actions
    OPERATION_NAME = 'TEST_OPERATION_1'
    OpenVaultHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.maker.OPEN_VAULT))
    WrapEthHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.WRAP_ETH))
    setApprovalHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.SET_APPROVAL))

    await operationsRegistry.addOp(
      OPERATION_NAME,
      [OpenVaultHash, WrapEthHash, setApprovalHash],
      [false, true, false],
    )

    openVaultAction = createAction(
      OpenVaultHash,
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.main.maker.joinETH_A,
        },
        [0],
      ],
    )

    wrapEthAction = createAction(
      WrapEthHash,
      [calldataTypes.common.WrapEth, calldataTypes.paramsMap],
      [
        {
          amount: wrapAmount.toFixed(0),
        },
        [0],
      ],
    )

    setApprovalAction = createAction(
      setApprovalHash,
      [calldataTypes.common.Approval, calldataTypes.paramsMap],
      [
        {
          asset: ADDRESSES.main.DAI,
          delegate: ADDRESSES.main.lender,
          amount: new BigNumber(100).toFixed(0),
          sumAmounts: false,
        },
        [0, 0, 0, 0],
      ],
    )
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
  })

  describe(`Regular Operation successful`, async () => {
    it(`should execute an Operation successfully`, async () => {
      const success = await executeOperation(
        system,
        [openVaultAction, wrapEthAction, setApprovalAction],
        OPERATION_NAME,
        signer,
        wrapAmount,
      )

      expect(success).to.be.eq(true)
    })
  })

  describe(`Operation with skipped Action successful`, async () => {
    it(`should execute an Operation successfully with optional Action skipped`, async () => {
      wrapEthAction.skipped = true
      const success = await executeOperation(
        system,
        [openVaultAction, wrapEthAction, setApprovalAction],
        OPERATION_NAME,
        signer,
        wrapAmount,
      )

      expect(success).to.be.eq(true)
    })
  })

  describe(`Operation with mandatory Action skipped`, async () => {
    it(`should fail executing an Operation with mandatory Action skipped`, async () => {
      setApprovalAction.skipped = true
      const success = await executeOperation(
        system,
        [openVaultAction, wrapEthAction, setApprovalAction],
        OPERATION_NAME,
        signer,
        wrapAmount,
      )

      expect(success).to.be.eq(false)
    })
  })
})
