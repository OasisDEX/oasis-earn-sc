import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { JsonRpcProvider } from '@ethersproject/providers'
import CDPManagerABI from '@oasisdex/abis/external/protocols/maker/dss-cdp-manager.json'
import { ADDRESSES } from '@oasisdex/addresses/src'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import { expect, restoreSnapshot } from '@oasisdex/dma-common/test-utils'
import { DeployedSystemInfo } from '@oasisdex/dma-common/test-utils/deploy-system'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { executeThroughProxy } from '@oasisdex/dma-common/utils/execute'
import { getLastVault } from '@oasisdex/dma-common/utils/maker/vault'
import { ServiceRegistry } from '@oasisdex/dma-common/utils/wrappers/service-registry'
import { ActionFactory, calldataTypes } from '@oasisdex/dma-library/src'
import { loadFixture } from 'ethereum-waffle'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'

const createAction = ActionFactory.create

describe(`Reentrancy guard test | Unit`, async () => {
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
          joinAddress: ADDRESSES.main.maker.joinETH_A,
        },
        [0],
      ],
    )

    // LOCK OperationStorage before operation execution
    await system.common.operationStorage.lock()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [success, _] = await executeThroughProxy(
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
      ADDRESSES.main.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })
})
