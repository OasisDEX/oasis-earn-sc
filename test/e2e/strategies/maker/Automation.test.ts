/* eslint-disable @typescript-eslint/no-non-null-assertion */
import CDPManagerABI from '@abi/dss-cdp-manager.json'
import ERC20ABI from '@abi/IERC20.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { executeThroughProxy } from '@helpers/deploy'
import { getOraclePrice } from '@helpers/maker/oracle'
import { getLastVault, getVaultInfo } from '@helpers/maker/vault'
import { restoreSnapshot } from '@helpers/restoreSnapshot'
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { RuntimeConfig } from '@helpers/types/common'
import { amountToWei, ensureWeiFormat } from '@helpers/utils'
import {
  ActionCall,
  ActionFactory,
  ADDRESSES,
  calldataTypes,
  CONTRACT_NAMES,
  OPERATION_NAMES,
} from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import { DeployedSystemInfo } from '../../../deploySystem'
import { initialiseConfig } from '../../../fixtures/setup'
import { expectToBeEqual } from '../../../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

/**
 * Skipped until Maker operations more relevant.
 * Also fails due to issue with getOracleProvider and hardhat version.
 * Requires hardhat v2.9.5 or greater
 * Currently only hardhat v2.8.0 is tested as working well with tenderly export
 * */
describe.skip(`Operations | Maker | Automation Integration`, async () => {
  const marketPrice = new BigNumber(1585)

  let provider: JsonRpcProvider
  let signer: Signer
  let system: DeployedSystemInfo
  let registry: ServiceRegistry
  let config: RuntimeConfig
  let oraclePrice: BigNumber

  beforeEach(async function () {
    ;({ config, provider, signer } = await loadFixture(initialiseConfig))

    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)

    // When changing block number remember to check vault id that is used for automation
    const testBlockNumberToGetCorrectVaultId = 15695000
    const { snapshot } = await restoreSnapshot({
      config,
      provider,
      blockNumber: testBlockNumberToGetCorrectVaultId,
      useFallbackSwap: true,
    })

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry

    oraclePrice = await getOraclePrice(provider)

    await system.common.exchange.setPrice(ADDRESSES.main.WETH, amountToWei(marketPrice).toFixed(0))
  })

  it(`should open vault, deposit ETH, allow Automation Bot & then Run Automation based Operation`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const daiTopUp = new BigNumber(0)
    const collTopUp = new BigNumber(0)

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

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

    const pullTokenIntoProxyAction = createAction(
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

    const initialDepositAction = createAction(
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

    const cdpAllow = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.CDP_ALLOW),
      [calldataTypes.maker.CdpAllow, calldataTypes.paramsMap],
      [
        {
          vaultId: 0,
          userAddress: system.common.dummyAutomation.address,
        },
        [1, 0],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      cdpAllow,
    ]

    await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
        ]),
      },
      signer,
    )

    const autoTestAmount = new BigNumber(40000)
    const autoVaultId = 29595
    const generateDaiAutomation = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: autoVaultId,
          amount: ensureWeiFormat(autoTestAmount),
        },
        [0, 0, 0],
      ],
    )

    const dummyAction = createAction(
      await registry.getEntryHash('DummyAction'),
      ['tuple(address to)', calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
        },
        [0],
      ],
    )

    const cdpAllowOpExecutor = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.CDP_ALLOW),
      [calldataTypes.maker.CdpAllow, calldataTypes.paramsMap],
      [
        {
          vaultId: autoVaultId,
          userAddress: system.common.operationExecutor.address,
        },
        [0, 0],
      ],
    )

    const takeAFlashloanAutomation = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: ensureWeiFormat(autoTestAmount),
          isProxyFlashloan: false,
          isDPMProxy: false,
          calls: [generateDaiAutomation, dummyAction, dummyAction],
        },
        [0, 0, 0, 0],
      ],
    )

    const executionData = system.common.operationExecutor.interface.encodeFunctionData(
      'executeOp',
      [
        [cdpAllowOpExecutor, dummyAction, takeAFlashloanAutomation, dummyAction],
        OPERATION_NAMES.common.CUSTOM_OPERATION, //just to skip operation's actions verification
      ],
    )

    // DELEGATECALL
    await system.common.dummyAutomation[
      'doAutomationStuffDelegateCall(bytes,address,uint256,address)'
    ](
      executionData,
      system.common.operationExecutor.address,
      autoVaultId,
      system.common.dummyCommmand.address,
      {
        gasLimit: 4000000,
      },
    )

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expectToBeEqual(currentCollRatio, new BigNumber(3.384), 3)

    expectToBeEqual(info.coll.toFixed(0), initialColl.toFixed(0))
    expectToBeEqual(info.debt.toFixed(0), autoTestAmount.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES.main.maker.cdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expectToBeEqual(vaultOwner, system.common.userProxyAddress)
  })
})
