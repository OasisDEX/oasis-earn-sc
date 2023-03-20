import { ActionFactory, calldataTypes } from '@dupa-library'
import { expect, restoreSnapshot } from '@oasisdex/dupa-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import { loadFixture } from 'ethereum-waffle'
import { initialiseConfig } from '@dupa-library/test/fixtures'
import { testBlockNumber } from '@dupa-library/test/config'
import { ADDRESSES } from '@dupa-library/utils/addresses'
import BigNumber from 'bignumber.js'
import { ensureWeiFormat } from '@oasisdex/dupa-common/utils/common'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@dupa-library/utils/constants'
import { executeThroughProxy } from '@oasisdex/dupa-common/utils/execute'
import { TEN } from '@oasisdex/dupa-common/constants'
import { DeployedSystemInfo } from '@dupa-library/test/utils/deploy-system'
import { ServiceRegistry } from '@dupa-library/test/utils'
import { JsonRpcProvider } from '@ethersproject/providers'

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
