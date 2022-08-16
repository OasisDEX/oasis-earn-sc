import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  TEN,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'

import { executeThroughProxy } from '../../helpers/deploy'
import init, { resetNode } from '../../helpers/init'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig } from '../../helpers/types/common'
import { ensureWeiFormat } from '../../helpers/utils'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'

const createAction = ActionFactory.create

describe('TakeFlashloan Action', () => {
  const BLOCK_NUMBER = 14798701
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let snapshotId: string
  let provider: JsonRpcProvider

  before(async () => {
    config = await init()
    provider = config.provider
    await resetNode(config.provider, BLOCK_NUMBER)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should take flashloan', async () => {
    const sendBackDAI = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
      [calldataTypes.common.SendToken],
      [
        {
          amount: ensureWeiFormat(AMOUNT),
          asset: ADDRESSES.main.DAI,
          to: system.common.operationExecutor.address,
        },
        [0],
      ],
    )

    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: ensureWeiFormat(AMOUNT),
          dsProxyFlashloan: true,
          calls: [sendBackDAI],
        },
        [0],
      ],
    )

    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeAFlashloan],
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      config.signer,
    )
    await expect(txReceipt).to.be.ok
  })

  it('should fail if partially repayed', async () => {
    const sendBackDAI = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
      [calldataTypes.common.SendToken],
      [
        {
          amount: ensureWeiFormat(AMOUNT.minus(TEN)),
          asset: ADDRESSES.main.DAI,
          to: system.common.operationExecutor.address,
        },
        [0],
      ],
    )

    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: ensureWeiFormat(AMOUNT),
          dsProxyFlashloan: true,
          calls: [sendBackDAI],
        },
        [0],
      ],
    )

    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeAFlashloan],
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      config.signer,
    )
    expect(txReceipt.toString()).to.contain(`Error: Transaction reverted without a reason string`)
  })

  it('should fail if flashloan not repayed', async () => {
    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: ensureWeiFormat(AMOUNT),
          dsProxyFlashloan: true,
          calls: [],
        },
        [0],
      ],
    )

    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [takeAFlashloan],
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      config.signer,
    )
    expect(txReceipt.toString()).to.contain(`Error: Transaction reverted without a reason string`)
  })
})
