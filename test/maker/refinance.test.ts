import { JsonRpcProvider } from '@ethersproject/providers'
import {
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
  operations,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { executeThroughProxy } from '../../helpers/deploy'
import { GasEstimateHelper, gasEstimateHelper } from '../../helpers/gasEstimation'
import { getLastVault, getVaultInfo } from '../../helpers/maker/vault'
import { restoreSnapshot } from '../../helpers/restoreSnapshot'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig } from '../../helpers/types/common'
import { CDPInfo, VaultInfo } from '../../helpers/types/maker'
import { amountToWei, ensureWeiFormat } from '../../helpers/utils'
import { testBlockNumber } from '../config'
import { DeployedSystemInfo } from '../deploySystem'
import { initialiseConfig } from '../fixtures/setup'
import { expectToBeEqual } from '../utils'

const createAction = ActionFactory.create

describe(`Operations | Maker | Simple refinance`, async () => {
  const initialColl = new BigNumber(100)
  const initialDebt = new BigNumber(45_000)

  let DAI: Contract
  let WETH: Contract
  let cdpManagerContract: Contract

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig

  let vault: CDPInfo
  let info: VaultInfo

  let refinancedVault: CDPInfo
  let refinancedInfo: VaultInfo

  let refinanceTxStatus: boolean
  let openTxStatus: boolean

  before(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))

    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)
    cdpManagerContract = new ethers.Contract(
      ADDRESSES.main.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)

    const snapshot = await restoreSnapshot(config, provider, testBlockNumber)

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry

    gasEstimates = gasEstimateHelper()

    await WETH.approve(system.common.userProxyAddress, amountToWei(initialColl).toFixed(0))

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

    const pullCollateralIntoProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          from: config.address,
          asset: ADDRESSES.main.WETH,
          amount: new BigNumber(ensureWeiFormat(initialColl)).toFixed(0),
        },
        [0, 0, 0],
      ],
    )

    const depositAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES.main.maker.joinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    const generateAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: address,
          vaultId: 0,
          amount: ensureWeiFormat(initialDebt),
        },
        [0, 1, 0],
      ],
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_openTxStatus, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          [openVaultAction, pullCollateralIntoProxyAction, depositAction, generateAction],
          OPERATION_NAMES.maker.OPEN_AND_DRAW,
        ]),
      },
      signer,
    )
    openTxStatus = _openTxStatus

    gasEstimates.save(txReceipt)
    vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

    const refinanceCalls = await operations.maker.refinanceVault(
      {
        collateral: amountToWei(info.coll),
        debt: amountToWei(info.debt),
        joinAddress: ADDRESSES.main.maker.joinETH_A,
        newVaultJoinAddress: ADDRESSES.main.maker.joinETH_B,
        proxyAddress: system.common.dsProxy.address,
        vaultId: new BigNumber(vault.id),
        isEth: true,
      },
      {
        operationExecutor: system.common.operationExecutor.address,
        DAI: ADDRESSES.main.DAI,
      },
    )

    const [_refinanceTxStatus] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          refinanceCalls,
          OPERATION_NAMES.common.CUSTOM_OPERATION,
        ]),
      },
      signer,
    )
    refinanceTxStatus = _refinanceTxStatus

    refinancedVault = await getLastVault(provider, signer, system.common.userProxyAddress)
    refinancedInfo = await getVaultInfo(
      system.maker.mcdView,
      refinancedVault.id,
      refinancedVault.ilk,
    )
  })

  let gasEstimates: GasEstimateHelper

  it('Tx should pass', async () => {
    expect(openTxStatus).to.be.eq(true, 'Open tx should pass')
    expect(refinanceTxStatus).to.be.eq(true, 'Refinance tx should pass')
  })

  it('should open new vault', async () => {
    expect(vault.id + 1).to.eq(refinancedVault.id)
  })

  it(`should move debt to new vault`, async () => {
    expectToBeEqual(info.debt, refinancedInfo.debt, 5)
  })

  it(`should move collateral to new vault`, async () => {
    expectToBeEqual(info.coll, refinancedInfo.coll)
  })

  afterEach(() => {
    gasEstimates.print()
  })
})
