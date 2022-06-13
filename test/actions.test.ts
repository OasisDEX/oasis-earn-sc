import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../abi/dss-cdp-manager.json'
import ERC20ABI from '../abi/IERC20.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_LABELS, ZERO } from '../helpers/constants'
import { executeThroughProxy } from '../helpers/deploy'
import { resetNode } from '../helpers/init'
import { getVaultInfo } from '../helpers/maker/vault-info'
import { calldataTypes } from '../helpers/types/actions'
import { ExchangeData, RuntimeConfig, SwapData } from '../helpers/types/common'
import {
  ActionCall,
  ActionFactory,
  amountToWei,
  approve,
  send,
  ensureWeiFormat,
  ServiceRegistry,
} from '../helpers/utils'
import {
  DeployedSystemInfo,
  deployTestSystem,
  getLastCDP,
  getOraclePrice,
} from './helpers/deploy-test-system'
import { gasEstimateHelper } from './helpers/gas-estimation.utils'
import { calculateParamsIncreaseMP, prepareMultiplyParameters } from './helpers/param-calculations'
import { expectToBeEqual } from './helpers/test-utils'

const LENDER_FEE = new BigNumber(0)

const createAction = ActionFactory.create

async function testScenarios<S, R extends (scenario: S) => void>(scenarios: S[], runner: R) {
  for (const scenario of scenarios) {
    runner(scenario)
  }
}

let DAI: Contract
let WETH: Contract

describe('Proxy Actions | PoC | w/ Dummy Exchange', async () => {
  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let registry: ServiceRegistry

  let config: RuntimeConfig

  before(async () => {
    provider =
      process.env.USE_STANDALONE_NODE === `1`
        ? new ethers.providers.JsonRpcProvider()
        : ethers.provider
    signer = provider.getSigner(0)
    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)

    address = await signer.getAddress()

    const blockNumber = 13274574
    resetNode(provider, blockNumber)

    system = await deployTestSystem(true)

    registry = new ServiceRegistry(system.serviceRegistry.address, signer)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config = { provider, signer, address }
  })

  describe(`open|Deposit|Draw|Payback => Operation | Action by Action`, async () => {
    const marketPrice = new BigNumber(2380)
    const initialColl = new BigNumber(100) // STARTING COLLATERAL AMOUNT
    const initialDebt = new BigNumber(20000) // STARTING VAULT DEBT
    let vaultId: number

    const gasEstimates = gasEstimateHelper()

    before(async () => {
      await system.exchangeInstance.setPrice(
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
      await WETH.transfer(system.userProxyAddress, amountToWei(initialColl).toFixed(0))

      const openVaultAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.OPEN_VAULT),
        [calldataTypes.maker.Open, `uint8[] paramsMap`],
        [
          {
            joinAddress: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
          },
          [0],
        ],
      )

      const depositAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
        [calldataTypes.maker.Deposit, `uint8[] paramsMap`],
        [
          {
            joinAddress: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
            vaultId: 25790,
            amount: ensureWeiFormat(initialColl),
          },
          [1],
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [openVaultAction, depositAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.openVault, txReceipt)

      const vault = await getLastCDP(provider, signer, system.userProxyAddress)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      vaultId = vault.id
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      expect(info.coll.toString()).to.equal(initialColl.toFixed(0))
      expect(info.debt.toString()).to.equal(new BigNumber(0).toFixed(0))

      const cdpManagerContract = new ethers.Contract(
        ADDRESSES.main.cdpManager,
        CDPManagerABI,
        provider,
      ).connect(signer)
      const vaultOwner = await cdpManagerContract.owns(vault.id)
      expectToBeEqual(vaultOwner, system.userProxyAddress)
    })

    it.skip(testNames.generatedDebt, async () => {
      const generateAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.GENERATE),
        [calldataTypes.maker.Generate],
        [
          {
            to: address,
            mcdManager: ADDRESSES.main.cdpManager,
            vaultId,
            amount: ensureWeiFormat(initialDebt),
          },
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [generateAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.generatedDebt, txReceipt)

      const vault = await getLastCDP(provider, signer, system.userProxyAddress)
      vaultId = vault.id
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(initialDebt.toFixed(0))
    })

    it.skip(testNames.paybackDebt, async () => {
      const paybackDai = new BigNumber(5000)
      const paybackAll = false
      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.PAYBACK),
        [calldataTypes.maker.Payback],
        [
          {
            vaultId,
            userAddress: address,
            daiJoin: ADDRESSES.main.joinDAI,
            mcdManager: ADDRESSES.main.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
        ],
      )

      const ALLOWANCE = new BigNumber(10000000000000000000000000)
      await DAI.approve(system.dsProxyInstance.address, ensureWeiFormat(ALLOWANCE))

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [paybackAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testNames.paybackDebt, txReceipt)

      const vault = await getLastCDP(provider, signer, system.userProxyAddress)
      vaultId = vault.id
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      const expectedDebt = initialDebt.minus(paybackDai)
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    it.skip(testNames.paybackAllDebt, async () => {
      const vault = await getLastCDP(provider, signer, system.userProxyAddress)

      const prePaybackInfo = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)
      const paybackDai = new BigNumber(0) // Can be anything because paybackAll flag is true
      const paybackAll = true

      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.PAYBACK),
        [calldataTypes.maker.Payback],
        [
          {
            vaultId,
            userAddress: address,
            daiJoin: ADDRESSES.main.joinDAI,
            mcdManager: ADDRESSES.main.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
        ],
      )

      const ALLOWANCE = new BigNumber(prePaybackInfo.debt)
      await DAI.approve(system.dsProxyInstance.address, ensureWeiFormat(ALLOWANCE))

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [paybackAction],
          ]),
        },
        signer,
      )
      gasEstimates.save(testNames.paybackAllDebt, txReceipt)

      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      const expectedDebt = new BigNumber(0)
      expect(info.coll.toFixed(0)).to.equal(initialColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    it.skip(testNames.withdrawColl, async () => {
      const withdrawAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.WITHDRAW),
        [calldataTypes.maker.Withdraw],
        [
          {
            vaultId,
            userAddress: address,
            joinAddr: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
            amount: ensureWeiFormat(initialColl),
          },
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [withdrawAction],
          ]),
        },
        signer,
      )
      gasEstimates.save(testNames.withdrawColl, txReceipt)

      const vault = await getLastCDP(provider, signer, system.userProxyAddress)
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      const expectedDebt = new BigNumber(0)
      const expectedColl = new BigNumber(0)
      expect(info.coll.toFixed(0)).to.equal(expectedColl.toFixed(0))
      expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))
    })

    after(() => {
      gasEstimates.print()
    })
  })

  describe.skip(`open|Deposit|Draw|Payback => Operation | Full Operation`, async () => {
    const marketPrice = new BigNumber(2380)
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(20000)

    const gasEstimates = gasEstimateHelper()

    before(async () => {
      await system.exchangeInstance.setPrice(
        ADDRESSES.main.ETH,
        amountToWei(marketPrice).toFixed(0),
      )
    })

    const testName = `should open vault, deposit ETH, generate DAI, repay debt in full and withdraw collateral`
    it(testName, async () => {
      const openVaultAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.OPEN_VAULT),
        [calldataTypes.maker.Open],
        [
          {
            joinAddress: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
          },
        ],
      )

      const depositAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
        [calldataTypes.maker.Deposit],
        [
          {
            joinAddress: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
            vaultId: 0,
            amount: ensureWeiFormat(initialColl),
          },
        ],
      )

      const generateAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.GENERATE),
        [calldataTypes.maker.Generate],
        [
          {
            to: address,
            mcdManager: ADDRESSES.main.cdpManager,
            vaultId: 0,
            amount: ensureWeiFormat(initialDebt),
          },
        ],
      )

      const paybackDai = new BigNumber(0) // Can be anything because paybackAll flag is true
      const paybackAll = true

      const paybackAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.PAYBACK),
        [calldataTypes.maker.Payback],
        [
          {
            vaultId: 0,
            userAddress: address,
            daiJoin: ADDRESSES.main.joinDAI,
            mcdManager: ADDRESSES.main.cdpManager,
            amount: ensureWeiFormat(paybackDai),
            paybackAll: paybackAll,
          },
        ],
      )

      const ALLOWANCE = new BigNumber('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
      await DAI.approve(system.dsProxyInstance.address, ensureWeiFormat(ALLOWANCE))

      const withdrawAction = createAction(
        await registry.getEntryHash(CONTRACT_LABELS.maker.WITHDRAW),
        [calldataTypes.maker.Withdraw],
        [
          {
            vaultId: 0,
            userAddress: address,
            joinAddr: ADDRESSES.main.joinETH_A,
            mcdManager: ADDRESSES.main.cdpManager,
            amount: ensureWeiFormat(initialColl),
          },
        ],
      )

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, txReceipt] = await executeThroughProxy(
        system.userProxyAddress,
        {
          address: system.operationExecutor.address,
          calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
            [openVaultAction, depositAction, generateAction, paybackAction, withdrawAction],
          ]),
        },
        signer,
      )

      gasEstimates.save(testName, txReceipt)

      const vault = await getLastCDP(provider, signer, system.userProxyAddress)
      const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)

      const expectedColl = new BigNumber(0)
      const expectedDebt = new BigNumber(0)
      expect(info.coll.toString()).to.equal(expectedColl.toFixed(0))
      expect(info.debt.toString()).to.equal(expectedDebt.toFixed(0))

      const cdpManagerContract = new ethers.Contract(
        ADDRESSES.main.cdpManager,
        CDPManagerABI,
        provider,
      ).connect(signer)
      const vaultOwner = await cdpManagerContract.owns(vault.id)
      expectToBeEqual(vaultOwner, system.userProxyAddress)
    })

    after(() => {
      gasEstimates.print()
    })
  })
})

describe.skip('Multiply Proxy Actions | PoC | w/ Dummy Exchange', async () => {
  const oazoFee = 2 // divided by base (10000), 1 = 0.01%;
  const oazoFeePct = new BigNumber(oazoFee).div(10000)
  const flashLoanFee = LENDER_FEE
  const slippage = new BigNumber(0.0001) // percentage

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let exchangeDataMock: { to: string; data: number }
  let registry: ServiceRegistry

  type DesiredCdpState = {
    requiredDebt: BigNumber
    toBorrowCollateralAmount: BigNumber
    daiTopUp: BigNumber
    fromTokenAmount: BigNumber
    toTokenAmount: BigNumber
    collTopUp: BigNumber
  }

  before(async () => {
    // provider = new ethers.providers.JsonRpcProvider()
    provider = ethers.provider
    signer = provider.getSigner(0)
    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)
    address = await signer.getAddress()

    const blockNumber = 13274574
    resetNode(provider, blockNumber)

    system = await deployTestSystem(true)
    registry = new ServiceRegistry(system.serviceRegistry.address, signer)

    exchangeDataMock = {
      to: system.exchangeInstance.address,
      data: 0,
    }
  })

  describe(`Increase Multiple Operations`, async () => {
    let oraclePrice: BigNumber
    const marketPrice = new BigNumber(2900)
    const defaultInitialColl = new BigNumber(100)
    const defaultInitialDebt = new BigNumber(0)
    const defaultDaiTopUp = new BigNumber(0)
    const defaultCollTopUp = new BigNumber(0)

    const gasEstimates = gasEstimateHelper()

    type OpenDepositIncreaseMultipleScenario = {
      testName: string
      initialColl: BigNumber
      initialDebt: BigNumber
      daiTopUp: BigNumber
      collTopUp: BigNumber
      requiredCollRatio: BigNumber
      useFlashloan: boolean
      vaultUnsafe: boolean
      debug?: boolean
    }

    before(async () => {
      oraclePrice = await getOraclePrice(provider)
      DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)

      await system.exchangeInstance.setPrice(
        ADDRESSES.main.ETH,
        amountToWei(marketPrice).toFixed(0),
      )
    })

    const scenarios: Array<OpenDepositIncreaseMultipleScenario> = [
      {
        testName: `should open vault, deposit ETH and increase multiple`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: defaultCollTopUp,
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2.5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
        debug: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: defaultCollTopUp,
        useFlashloan: true,
        requiredCollRatio: new BigNumber(1),
        vaultUnsafe: true,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Coll topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: new BigNumber(10),
        useFlashloan: false,
        requiredCollRatio: new BigNumber(5),
        vaultUnsafe: false,
        debug: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +Coll topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: defaultDaiTopUp,
        collTopUp: new BigNumber(10),
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2.5),
        vaultUnsafe: false,
      },
      {
        testName: `should open vault, deposit ETH and increase multiple & [+Flashloan, +Coll topup, +DAI topup]`,
        initialColl: defaultInitialColl,
        initialDebt: defaultInitialDebt,
        daiTopUp: new BigNumber(20000),
        collTopUp: new BigNumber(10),
        useFlashloan: true,
        requiredCollRatio: new BigNumber(2),
        vaultUnsafe: false,
      },
    ]

    const scenarioRunner = ({
      testName,
      initialColl,
      initialDebt,
      daiTopUp,
      collTopUp,
      useFlashloan,
      requiredCollRatio,
      vaultUnsafe,
      debug = false,
    }: OpenDepositIncreaseMultipleScenario) => {
      async function includeCollateralTopupActions({
        actions,
        topUpData,
      }: {
        actions: any[]
        topUpData: { token: string; amount: BigNumber; from: string }
      }) {
        const transferCollTopupToProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.SEND_TOKEN),
          [calldataTypes.common.SendToken],
          [
            {
              asset: topUpData.token,
              to: system.userProxyAddress,
              amount: ensureWeiFormat(topUpData.amount),
            },
          ],
        )

        const topupCollateralAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(collTopUp),
            },
          ],
        )

        actions.push(transferCollTopupToProxyAction)
        actions.push(topupCollateralAction)
      }
      async function includeDaiTopupActions({
        actions,
        topUpData,
      }: {
        actions: any[]
        topUpData: { token: string; amount: BigNumber; from: string }
      }) {
        const transferDaiTopupToProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.SEND_TOKEN),
          [calldataTypes.common.SendToken],
          [
            {
              asset: topUpData.token,
              to: system.userProxyAddress,
              amount: ensureWeiFormat(topUpData.amount),
            },
          ],
        )

        actions.push(transferDaiTopupToProxyAction)
      }
      async function includeIncreaseMultipleActions({
        actions,
        cdpState,
        exchangeData,
      }: {
        actions: any[]
        cdpState: DesiredCdpState
        exchangeData: ExchangeData
      }) {
        // Generate DAI -> Swap for collateral -> Deposit collateral
        const generateDaiForSwap = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.GENERATE),
          [calldataTypes.maker.Generate],
          [
            {
              to: address,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
          ],
        )

        const transferGeneratedDaiToProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.SEND_TOKEN),
          [calldataTypes.common.SendToken],
          [
            {
              asset: exchangeData.fromTokenAddress,
              to: system.userProxyAddress,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
          ],
        )

        const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
          .plus(ensureWeiFormat(cdpState.daiTopUp))
          .toFixed(0)

        const swapData: SwapData = {
          fromAsset: exchangeData.fromTokenAddress,
          toAsset: exchangeData.toTokenAddress,
          // Add daiTopup amount to swap
          amount: swapAmount,
          receiveAtLeast: exchangeData.minToTokenAmount,
          withData: exchangeData._exchangeCalldata,
        }

        await DAI.approve(system.userProxyAddress, amountToWei(swapAmount).toFixed(0))
        const swapAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.EXCHANGE),
          [calldataTypes.common.Swap],
          [swapData],
        )

        const collateralToDeposit = cdpState.toBorrowCollateralAmount.plus(cdpState.collTopUp)
        const depositBorrowedCollateral = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(collateralToDeposit),
            },
          ],
        )

        // Add actions
        actions.push(generateDaiForSwap)
        actions.push(transferGeneratedDaiToProxyAction)
        actions.push(swapAction)
        actions.push(depositBorrowedCollateral)
      }
      async function includeIncreaseMultipleWithFlashloanActions({
        actions,
        cdpState,
        exchangeData,
      }: {
        actions: any[]
        cdpState: DesiredCdpState
        exchangeData: ExchangeData
      }) {
        // Get flashloan -> Swap for collateral -> Deposit collateral -> Generate DAI -> Repay flashloan
        const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
          .plus(ensureWeiFormat(cdpState.daiTopUp))
          .toFixed(0)

        const swapData: SwapData = {
          fromAsset: exchangeData.fromTokenAddress,
          toAsset: exchangeData.toTokenAddress,
          // Add daiTopup amount to swap
          amount: swapAmount,
          receiveAtLeast: exchangeData.minToTokenAmount,
          withData: exchangeData._exchangeCalldata,
        }

        await DAI.approve(system.userProxyAddress, amountToWei(swapAmount).toFixed(0))
        const swapAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.EXCHANGE),
          [calldataTypes.common.Swap],
          [swapData],
        )

        const depositBorrowedCollateral = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.toBorrowCollateralAmount),
            },
          ],
        )

        const generateDaiToRepayFL = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.GENERATE),
          [calldataTypes.maker.Generate],
          [
            {
              to: address,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
          ],
        )

        const transferGeneratedDaiToProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.SEND_TOKEN),
          [calldataTypes.common.SendToken],
          [
            {
              asset: exchangeData.fromTokenAddress,
              to: system.userProxyAddress,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
          ],
        )

        const takeAFlashloan = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.TAKE_A_FLASHLOAN),
          [calldataTypes.common.TakeAFlashLoan],
          [
            {
              amount: exchangeData.fromTokenAmount,
              borrower: system.operationExecutor.address,
              calls: [
                swapAction,
                depositBorrowedCollateral,
                generateDaiToRepayFL,
                transferGeneratedDaiToProxyAction,
              ],
            },
          ],
        )

        // Add actions
        actions.push(takeAFlashloan)
      }
      async function includeFlushProxyAction({
        actions,
        flushData,
      }: {
        actions: any[]
        flushData: { token: string; to: string; flAmount: string }
      }) {
        const flushProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.PULL_TOKEN),
          [calldataTypes.common.PullToken],
          [flushData.token, flushData.to, flushData.flAmount],
        )

        actions.push(flushProxyAction)
      }

      it(testName, async () => {
        await DAI.approve(system.userProxyAddress, amountToWei(daiTopUp).toFixed(0))
        await WETH.approve(system.userProxyAddress, amountToWei(collTopUp).toFixed(0))

        const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } =
          calculateParamsIncreaseMP({
            oraclePrice,
            marketPrice,
            oazoFee: oazoFeePct,
            flashLoanFee,
            currentColl: initialColl,
            currentDebt: initialDebt,
            daiTopUp,
            collTopUp,
            requiredCollRatio,
            slippage,
            debug,
          })

        const desiredCdpState = {
          requiredDebt,
          toBorrowCollateralAmount: additionalCollateral,
          daiTopUp,
          fromTokenAmount: requiredDebt.plus(daiTopUp),
          toTokenAmount: additionalCollateral,
          collTopUp,
        }

        const { exchangeData } = prepareMultiplyParameters({
          oneInchPayload: exchangeDataMock,
          desiredCdpState,
          fundsReceiver: address,
          skipFL: !useFlashloan,
        })

        const openVaultAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.OPEN_VAULT),
          [calldataTypes.maker.Open],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
            },
          ],
        )

        const initialDepositAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(initialColl),
            },
          ],
        )

        const actions: ActionCall[] = [openVaultAction, initialDepositAction]
        const useCollateralTopup = desiredCdpState.collTopUp.gt(ZERO)
        const useDaiTopup = desiredCdpState.daiTopUp.gt(ZERO)

        // Deposit collateral prior to increasing multiple
        useCollateralTopup &&
          includeCollateralTopupActions({
            actions,
            topUpData: {
              token: exchangeData?.toTokenAddress,
              amount: desiredCdpState.collTopUp,
              from: address,
            },
          })

        // Add dai to proxy for use in primary swap
        useDaiTopup &&
          includeDaiTopupActions({
            actions,
            topUpData: {
              token: DAI?.address,
              amount: desiredCdpState.daiTopUp,
              from: address,
            },
          })

        // Gather dai from vault then swap for collateral
        !useFlashloan &&
          (await includeIncreaseMultipleActions({
            actions,
            cdpState: desiredCdpState,
            exchangeData,
          }))

        // Leverage flashloan to buy collateral, deposit borrowed collateral, draw dai and repay loan
        useFlashloan &&
          (await includeIncreaseMultipleWithFlashloanActions({
            actions,
            cdpState: desiredCdpState,
            exchangeData,
          }))

        // Transfer back unused balance from proxy
        useDaiTopup &&
          includeFlushProxyAction({
            actions,
            flushData: {
              token: DAI?.address,
              to: address,
              flAmount: useFlashloan ? exchangeData.fromTokenAmount : ZERO.toString(),
            },
          })

        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, txReceipt] = await executeThroughProxy(
            system.userProxyAddress,
            {
              address: system.operationExecutor.address,
              calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [
                actions,
              ]),
            },
            signer,
          )

          gasEstimates.save(testName, txReceipt)
        } catch {
          expect(vaultUnsafe).to.be.true
          return
        }

        const vault = await getLastCDP(provider, signer, system.userProxyAddress)
        const info = await getVaultInfo(system.mcdViewInstance, vault.id, vault.ilk)
        const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)
        expectToBeEqual(currentCollRatio, requiredCollRatio, 3)

        const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
        const expectedDebt = desiredCdpState.requiredDebt

        expect(info.coll.toFixed(0)).to.equal(expectedColl.toFixed(0))
        expect(info.debt.toFixed(0)).to.equal(expectedDebt.toFixed(0))

        const cdpManagerContract = new ethers.Contract(
          ADDRESSES.main.cdpManager,
          CDPManagerABI,
          provider,
        ).connect(signer)
        const vaultOwner = await cdpManagerContract.owns(vault.id)
        expectToBeEqual(vaultOwner, system.userProxyAddress)
      })
    }

    testScenarios(scenarios, scenarioRunner)

    after(() => {
      gasEstimates.print()
    })
  })
})
