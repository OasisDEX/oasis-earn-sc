/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ActionCall,
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getOraclePrice } from '../../helpers/maker/oracle'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import {
  calculateParamsIncreaseMP,
  prepareMultiplyParameters,
} from '../../helpers/paramCalculations'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig, SwapData } from '../../helpers/types/common'
import { amountToWei, ensureWeiFormat } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo, deploySystem } from '../deploySystem'
import { expectToBeEqual } from '../utils'

const LENDER_FEE = new BigNumber(0)

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

describe(`Reentrancy guard test`, async () => {

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let exchangeDataMock: { to: string; data: number }
  let registry: ServiceRegistry
  let config: RuntimeConfig

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)

    // When changing block number remember to check vault id that is used for automation
    await resetNode(provider, testBlockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config = { provider, signer, address }

    exchangeDataMock = {
      to: system.common.exchange.address,
      data: 0,
    }
  })

  const testName = `should execute an action, even if OperationStorage lock() was called by another address`
  it(testName, async () => {
   
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
          [
            openVaultAction,
          ],
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      signer,
    )

    expect(success).to.be.eq(true)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)

    expect(vault.id).to.be.eq(29062)

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES.main.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expectToBeEqual(vaultOwner, system.common.userProxyAddress)
  })
})
