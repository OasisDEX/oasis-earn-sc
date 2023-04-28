import CDPManagerABI from '@abis/external/protocols/maker/dss-cdp-manager.json'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@dma-common/constants'
import { DeployedSystemInfo, expect, restoreSnapshot } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { getLastVault } from '@dma-common/utils/maker'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import { ServiceRegistry } from '@dma-deployments/utils/wrappers'
import { ActionFactory, calldataTypes } from '@dma-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { loadFixture } from 'ethereum-waffle'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'

const createAction = ActionFactory.create

// TODO: Fix broken test
describe.skip(`Reentrancy guard test | Unit`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig

  before(async () => {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    const { snapshot } = await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
    system = snapshot.deployed.system
    registry = snapshot.deployed.registry
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
  })

  it(`should execute an action, even if OperationStorage lock() was called by another address`, async () => {
    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.joins.MCD_JOIN_ETH_A,
        },
        [0],
      ],
    )

    // LOCK OperationStorage before operation execution
    await system.common.operationStorage.lock()

    const [success] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [openVaultAction],
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      signer,
    )

    expect(success).to.be.eq(true)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.common.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })
})
