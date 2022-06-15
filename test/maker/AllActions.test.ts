import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_NAMES } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import { DeployedSystemInfo, deploySystem } from '../../helpers/deploySystem'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getLastCDP } from '../../helpers/maker/getLastCdp'
import { getVaultInfo } from '../../helpers/maker/vaultInfo'
import { calldataTypes } from '../../helpers/types/actions'
import { RuntimeConfig } from '../../helpers/types/common'
import { ActionFactory, amountToWei, ensureWeiFormat, ServiceRegistry } from '../../helpers/utils'
import { expectToBeEqual } from './../utils'

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

describe('Operation => Maker | All Actions', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry

  let config: RuntimeConfig

  before(async () => {
    config = await init()
    provider = config.provider
    signer = config.signer
    address = config.address

    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)

    const blockNumber = 13274574
    resetNode(provider, blockNumber)

    const { system: _system, registry: _registry } = await deploySystem(config)
    system = _system
    registry = _registry
  })

  describe(`Operation => open|Deposit|Draw|Payback (1 by 1)`, async () => {
    const marketPrice = new BigNumber(2380)
    const initialColl = new BigNumber(100) // STARTING COLLATERAL AMOUNT
    const initialDebt = new BigNumber(20000) // STARTING VAULT DEBT
    let vaultId: number

    const gasEstimates = gasEstimateHelper()

    before(async () => {
      await system.common.exchange.setPrice(
        ADDRESSES.main.WETH,
        amountToWei(marketPrice).toFixed(0),
      )
    })

    const testNames = {
      openVault: `should open vault with initial collateral`,
      generatedDebt: `should generate expected debt`,
      paybackDebt: `should partially payback debt`,
      paybackAllDebt: `should payback remaining debt`,
      withdrawColl: `should withdraw collateral`,
    }

    it(testNames.openVault, async () => {
      await WETH.approve(system.common.userProxyAddress, amountToWei(initialColl).toFixed(0))

      const openVaultAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
        [calldataTypes.maker.Open, calldataTypes.paramsMap],
        [
          {
            joinAddress: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
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
          [0],
        ],
      )

      const depositAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
        [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
        [
          {
            joinAddress: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            vaultId: 0,
            amount: ensureWeiFormat(initialColl),
          },
          [1],
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [openVaultAction, pullCollateralIntoProxyAction, depositAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.openVault, txReceipt)

      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      vaultId = vault.id
      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      expect(info.coll.toString()).to.equal(initialColl.toFixed(0))
      expect(info.debt.toString()).to.equal(new BigNumber(0).toFixed(0))

      const cdpManagerContract = new ethers.Contract(
        ADDRESSES.main.maker.cdpManager,
        CDPManagerABI,
        provider,
      ).connect(signer)
      const vaultOwner = await cdpManagerContract.owns(vault.id)
      expectToBeEqual(vaultOwner, system.common.userProxyAddress)
    })

    it(testNames.generatedDebt, async () => {
      const generateAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
        [calldataTypes.maker.Generate],
        [
          {
            to: address,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            vaultId,
            amount: ensureWeiFormat(initialDebt),
          },
          [0],
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [generateAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.generatedDebt, txReceipt)

      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)
      vaultId = vault.id
      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(initialDebt.toFixed(0))
    })

    it(testNames.paybackDebt, async () => {
      const paybackDai = new BigNumber(5000)
      const paybackAll = false
      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.PAYBACK),
        [calldataTypes.maker.Payback],
        [
          {
            vaultId: vaultId,
            userAddress: address,
            daiJoin: ADDRESSES.main.maker.joinDAI,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
          [0],
        ],
      )

      const ALLOWANCE = new BigNumber(10000000000000000000000000)
      await DAI.approve(system.common.dsProxy.address, ensureWeiFormat(ALLOWANCE))

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [paybackAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.paybackDebt, txReceipt)

      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)
      vaultId = vault.id
      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      const expectedDebt = initialDebt.minus(paybackDai)
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    it(testNames.paybackAllDebt, async () => {
      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)

      const prePaybackInfo = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
      const paybackDai = new BigNumber(0) // Can be anything because paybackAll flag is true
      const paybackAll = true

      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.PAYBACK),
        [calldataTypes.maker.Payback],
        [
          {
            vaultId,
            userAddress: address,
            daiJoin: ADDRESSES.main.maker.joinDAI,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
          [0],
        ],
      )

      const ALLOWANCE = new BigNumber(prePaybackInfo.debt)
      await DAI.approve(system.common.dsProxy.address, ensureWeiFormat(ALLOWANCE))

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [paybackAction],
          ]),
        },
        signer,
      )
      gasEstimates.save(testNames.paybackAllDebt, txReceipt)

      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      const expectedDebt = new BigNumber(0)
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    it(testNames.withdrawColl, async () => {
      const withdrawAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.WITHDRAW),
        [calldataTypes.maker.Withdraw],
        [
          {
            vaultId,
            userAddress: address,
            joinAddr: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            amount: ensureWeiFormat(initialColl),
          },
          [0],
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [withdrawAction],
          ]),
        },
        signer,
      )
      gasEstimates.save(testNames.withdrawColl, txReceipt)

      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)
      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      const expectedDebt = new BigNumber(0)
      const expectedColl = new BigNumber(0)
      expect(info.coll.toFixed(0)).to.equal(expectedColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    after(() => {
      gasEstimates.print()
    })
  })

  describe(`Operation => open|Deposit|Draw|Payback (Combined)`, async () => {
    const marketPrice = new BigNumber(2380)
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(20000)

    const gasEstimates = gasEstimateHelper()

    before(async () => {
      await system.common.exchange.setPrice(ADDRESSES.main.ETH, amountToWei(marketPrice).toFixed(0))
    })

    const testName = `should open vault, deposit ETH, generate DAI, repay debt in full and withdraw collateral`
    it(testName, async () => {
      await WETH.approve(system.common.userProxyAddress, amountToWei(initialColl).toFixed(0))

      const openVaultAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
        [calldataTypes.maker.Open, calldataTypes.paramsMap],
        [
          {
            joinAddress: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
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
          [0],
        ],
      )

      const depositAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
        [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
        [
          {
            joinAddress: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            vaultId: 0,
            amount: ensureWeiFormat(initialColl),
          },
          [1],
        ],
      )

      const generateAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
        [calldataTypes.maker.Generate, calldataTypes.paramsMap],
        [
          {
            to: address,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            vaultId: 0,
            amount: ensureWeiFormat(initialDebt),
          },
          [1],
        ],
      )

      const paybackDai = new BigNumber(0) // Can be anything because paybackAll flag is true
      const paybackAll = true
      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.PAYBACK),
        [calldataTypes.maker.Payback, calldataTypes.paramsMap],
        [
          {
            vaultId: 0,
            userAddress: address,
            daiJoin: ADDRESSES.main.maker.joinDAI,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
          [1],
        ],
      )

      const ALLOWANCE = new BigNumber('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
      await DAI.approve(system.common.userProxyAddress, ensureWeiFormat(ALLOWANCE))

      const withdrawAction = createAction(
        await registry.getEntryHash(CONTRACT_NAMES.maker.WITHDRAW),
        [calldataTypes.maker.Withdraw, calldataTypes.paramsMap],
        [
          {
            vaultId: 0,
            userAddress: address,
            joinAddr: ADDRESSES.main.maker.joinETH_A,
            mcdManager: ADDRESSES.main.maker.cdpManager,
            amount: ensureWeiFormat(initialColl),
          },
          [1],
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.common.userProxyAddress,
        {
          address: system.common.operationExecutor.address,
          calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
            [
              openVaultAction,
              pullCollateralIntoProxyAction,
              depositAction,
              generateAction,
              paybackAction,
              withdrawAction,
            ],
          ]),
        },
        signer,
      )

      gasEstimates.save(testName, txReceipt)

      const vault = await getLastCDP(provider, signer, system.common.userProxyAddress)
      const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)

      const expectedColl = new BigNumber(0)
      const expectedDebt = new BigNumber(0)
      expect(info.coll.toString()).to.equal(expectedColl.toFixed(0))
      expect(info.debt.toString()).to.equal(expectedDebt.toFixed(0))

      const cdpManagerContract = new ethers.Contract(
        ADDRESSES.main.maker.cdpManager,
        CDPManagerABI,
        provider,
      ).connect(signer)
      const vaultOwner = await cdpManagerContract.owns(vault.id)
      expectToBeEqual(vaultOwner, system.common.userProxyAddress)
    })

    after(() => {
      gasEstimates.print()
    })
  })
})
