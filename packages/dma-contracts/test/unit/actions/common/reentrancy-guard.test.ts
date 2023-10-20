import CDPManagerABI from '@abis/external/protocols/maker/dss-cdp-manager.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { loadContractNames } from '@deploy-configurations/constants'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry as OperationRegistryWrapper } from '@deploy-configurations/utils/wrappers'
import { expect, restoreSnapshot } from '@dma-common/test-utils'
import { executeThroughProxy } from '@dma-common/utils/execute'
import { getLastVault } from '@dma-common/utils/maker'
import { testBlockNumber } from '@dma-contracts/test/config'
import { ActionFactory, calldataTypes } from '@dma-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { DsProxy } from '@typechain'
import { Signer, utils } from 'ethers'
import hre, { ethers } from 'hardhat'

const createAction = ActionFactory.create

// TODO: Fix broken test
describe.skip(`Reentrancy guard test | Unit`, async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let system: DeployedSystem
  let userProxy: DsProxy
  let OPERATION_NAME: string
  let OpenVaultActionHash: string
  let operationsRegistry: OperationRegistryWrapper

  before(async () => {
    const { snapshot } = await restoreSnapshot({ hre, blockNumber: testBlockNumber })
    system = snapshot.testSystem.deployment.system
    userProxy = snapshot.testSystem.userProxy
    provider = snapshot.config.provider
    signer = snapshot.config.signer

    operationsRegistry = new OperationRegistryWrapper(
      snapshot.testSystem.deployment.system.OperationsRegistry.contract.address,
      signer,
    )

    // Add new operation with optional Actions
    const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

    OPERATION_NAME = 'TEST_OPERATION_1'
    OpenVaultActionHash = utils.keccak256(
      utils.toUtf8Bytes(SERVICE_REGISTRY_NAMES.maker.OPEN_VAULT),
    )

    await operationsRegistry.addOp(OPERATION_NAME, [{ hash: OpenVaultActionHash, optional: true }])
  })

  afterEach(async () => {
    await restoreSnapshot({ hre, blockNumber: testBlockNumber })
  })

  it(`should execute an action, even if OperationStorage lock() was called by another address`, async () => {
    const openVaultAction = createAction(
      OpenVaultActionHash,
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.joins.MCD_JOIN_ETH_A,
        },
        [0],
      ],
    )

    // LOCK OperationStorage before operation execution
    await system.OperationStorage.contract.lock()

    const [success] = await executeThroughProxy(
      userProxy.address,
      {
        address: system.OperationExecutor.contract.address,
        calldata: system.OperationExecutor.contract.interface.encodeFunctionData('executeOp', [
          [openVaultAction],
          OPERATION_NAME,
        ]),
      },
      signer,
    )

    expect(success).to.be.eq(true)

    const vault = await getLastVault(provider, signer, userProxy.address)

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.common.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, userProxy.address)
  })
})
