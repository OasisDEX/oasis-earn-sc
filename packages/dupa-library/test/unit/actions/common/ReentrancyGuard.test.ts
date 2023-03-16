import {
  ActionFactory,
  calldataTypes,
} from '@dupa-library'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getLastVault } from '@oasisdex/dupa-common/utils/maker/vault'
import { restoreSnapshot } from '@oasisdex/dupa-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dupa-common/utils/types/common'
import CDPManagerABI from '@oasisdex/dupa-contracts/abi/dss-cdp-manager.json'
import { loadFixture } from 'ethereum-waffle'
import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { DeployedSystemInfo } from "@dupa-library/test/utils/deploy-system";
import { ServiceRegistry } from "@dupa-library/test/utils";
import { initialiseConfig } from "@dupa-library/test/fixtures";
import { testBlockNumber } from "@dupa-library/test/config";
import { CONTRACT_NAMES, OPERATION_NAMES } from "@dupa-library/utils/constants";
import { ADDRESSES } from "@dupa-library/utils/addresses";
import { executeThroughProxy } from "@oasisdex/dupa-common/utils/execute";
import { expect } from '@oasisdex/dupa-common/test-utils'

const createAction = ActionFactory.create

describe(`Reentrancy guard test`, async () => {
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
