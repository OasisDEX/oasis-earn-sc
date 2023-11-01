import { ADDRESSES } from '@deploy-configurations/addresses'
import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { OPERATION_NAMES, TEN } from '@dma-common/constants'
import { ensureWeiFormat, expect } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { DeployedSystemInfo, restoreSnapshot } from '@dma-contracts/utils'
import { ActionFactory, calldataTypes } from '@dma-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'

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
          asset: ADDRESSES[Network.MAINNET].common.DAI,
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
          asset: ADDRESSES[Network.MAINNET].common.DAI,
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
