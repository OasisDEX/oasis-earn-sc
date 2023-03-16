<<<<<<<< HEAD:packages/dupa-library/test/common/TakeFlashloan.test.ts
========
import { JsonRpcProvider } from '@ethersproject/providers'
import { executeThroughProxy } from '@helpers/deploy'
import { restoreSnapshot } from '@helpers/restoreSnapshot'
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { RuntimeConfig } from '@helpers/types/common'
import { ensureWeiFormat } from '@helpers/utils'
>>>>>>>> dev:test/unit/actions/common/TakeFlashloan.test.ts
import {
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  TEN,
} from '@dupa-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { executeThroughProxy } from '@oasisdex/dupa-common/utils/deploy'
import { restoreSnapshot } from '@oasisdex/dupa-common/utils/restore-snapshot'
import { ServiceRegistry } from '@oasisdex/dupa-common/utils/service-registry'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import { ensureWeiFormat } from '@oasisdex/dupa-common/utils/common'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'

<<<<<<<< HEAD:packages/dupa-library/test/common/TakeFlashloan.test.ts
import { testBlockNumber } from '../config'
import { DeployedSystemInfo } from '../deploy-system'
import { initialiseConfig } from '../fixtures/setup'
========
import { testBlockNumber } from '../../../config'
import { DeployedSystemInfo } from '../../../deploySystem'
import { initialiseConfig } from '../../../fixtures/setup'
>>>>>>>> dev:test/unit/actions/common/TakeFlashloan.test.ts

const createAction = ActionFactory.create

describe('TakeFlashloan Action', () => {
  const AMOUNT = new BigNumber(1000)
  let config: RuntimeConfig
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let provider: JsonRpcProvider

  before(async () => {
    ;({ config, provider } = await loadFixture(initialiseConfig))

    const { snapshot } = await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
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
          isProxyFlashloan: true,
          isDPMProxy: false,
          calls: [sendBackDAI],
        },
        [0],
      ],
    )

    const [, txReceipt] = await executeThroughProxy(
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
          isProxyFlashloan: true,
          isDPMProxy: false,
          calls: [sendBackDAI],
        },
        [0],
      ],
    )

    const [, txReceipt] = await executeThroughProxy(
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
          isProxyFlashloan: true,
          isDPMProxy: false,
          calls: [],
        },
        [0],
      ],
    )

    const [, txReceipt] = await executeThroughProxy(
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
