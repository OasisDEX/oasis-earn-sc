import { JsonRpcProvider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'

import CDPManagerABI from '../../abi/dss-cdp-manager.json'
import ERC20ABI from '../../abi/IERC20.json'
import { ADDRESSES } from '../../helpers/addresses'
import { CONTRACT_LABELS, ZERO } from '../../helpers/constants'
import { executeThroughProxy } from '../../helpers/deploy'
import {
  DeployedSystemInfo,
  deploySystem,
  getLastCDP,
  getOraclePrice,
} from '../../helpers/deploySystem'
import { gasEstimateHelper } from '../../helpers/gasEstimation'
import init, { resetNode } from '../../helpers/init'
import { getVaultInfo } from '../../helpers/maker/vault-info'
import {
  calculateParamsIncreaseMP,
  prepareMultiplyParameters,
} from '../../helpers/paramCalculations'
import { calldataTypes } from '../../helpers/types/actions'
import { ActionCall, ExchangeData, RuntimeConfig, SwapData } from '../../helpers/types/common'
import { ActionFactory, amountToWei, ensureWeiFormat, ServiceRegistry } from '../../helpers/utils'
import { expectToBeEqual } from './../utils'

const LENDER_FEE = new BigNumber(0)

const createAction = ActionFactory.create

function testOperations<S, R extends (scenario: S) => void>(operations: S[], runner: R) {
  for (const operation of operations) {
    runner(operation)
  }
}

let DAI: Contract
let WETH: Contract

describe('Operation => Maker | Increase Multiple', async () => {
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
  let config: RuntimeConfig

  type DesiredCdpState = {
    requiredDebt: BigNumber
    toBorrowCollateralAmount: BigNumber
    daiTopUp: BigNumber
    fromTokenAmount: BigNumber
    toTokenAmount: BigNumber
    collTopUp: BigNumber
  }

  before(async () => {
    provider = ethers.provider
    signer = provider.getSigner(0)
    DAI = new ethers.Contract(ADDRESSES.main.DAI, ERC20ABI, provider).connect(signer)
    WETH = new ethers.Contract(ADDRESSES.main.WETH, ERC20ABI, provider).connect(signer)
    address = await signer.getAddress()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config = { provider, signer, address }
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

    const increaseMultipleOperations: Array<OpenDepositIncreaseMultipleScenario> = [
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

    const operationRunner = ({
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
          await registry.getEntryHash(CONTRACT_LABELS.common.PULL_TOKEN),
          [calldataTypes.common.PullToken],
          [
            {
              asset: topUpData.token,
              from: address,
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
            [1],
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
          await registry.getEntryHash(CONTRACT_LABELS.common.PULL_TOKEN),
          [calldataTypes.common.PullToken],
          [
            {
              asset: topUpData.token,
              from: address,
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
          [calldataTypes.maker.Generate, calldataTypes.paramsMap],
          [
            {
              to: system.userProxyAddress,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
            [1],
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

        await DAI.approve(system.userProxyAddress, swapAmount)
        const swapAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.DUMMY_SWAP),
          [calldataTypes.common.Swap],
          [swapData],
        )

        const collateralToDeposit = cdpState.toBorrowCollateralAmount.plus(cdpState.collTopUp)
        const depositBorrowedCollateral = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(collateralToDeposit),
            },
            [1],
          ],
        )

        // Add actions
        actions.push(generateDaiForSwap)
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
        const pullBorrowedFundsIntoProxy = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.PULL_TOKEN),
          [calldataTypes.common.PullToken],
          [
            {
              amount: exchangeData.fromTokenAmount,
              asset: ADDRESSES.main.DAI,
              from: system.operationExecutor.address,
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

        await DAI.approve(system.userProxyAddress, swapAmount)
        // TODO: Move funds to proxy
        const swapAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.DUMMY_SWAP),
          [calldataTypes.common.Swap],
          [swapData],
        )

        const depositBorrowedCollateral = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.toBorrowCollateralAmount),
            },
            [1],
          ],
        )

        const generateDaiToRepayFL = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.GENERATE),
          [calldataTypes.maker.Generate, calldataTypes.paramsMap],
          [
            {
              to: system.userProxyAddress,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(cdpState.requiredDebt),
            },
            [1],
          ],
        )

        const sendBackDAI = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.SEND_TOKEN),
          [calldataTypes.common.SendToken],
          [
            {
              amount: exchangeData.fromTokenAmount,
              asset: ADDRESSES.main.DAI,
              to: system.operationExecutor.address,
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
                pullBorrowedFundsIntoProxy,
                swapAction,
                depositBorrowedCollateral,
                generateDaiToRepayFL,
                sendBackDAI,
              ],
            },
          ],
        )

        // Add actions
        actions.push(takeAFlashloan)
      }

      it(testName, async () => {
        await WETH.approve(
          system.userProxyAddress,
          amountToWei(initialColl.plus(collTopUp)).toFixed(0),
        )

        await DAI.approve(system.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

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

        const pullTokenIntoProxyAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.common.PULL_TOKEN),
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

        const initialDepositAction = createAction(
          await registry.getEntryHash(CONTRACT_LABELS.maker.DEPOSIT),
          [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
          [
            {
              joinAddress: ADDRESSES.main.joinETH_A,
              mcdManager: ADDRESSES.main.cdpManager,
              vaultId: 0,
              amount: ensureWeiFormat(initialColl),
            },
            [1],
          ],
        )

        const actions: ActionCall[] = [
          openVaultAction,
          pullTokenIntoProxyAction,
          initialDepositAction,
        ]
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [success, txReceipt] = await executeThroughProxy(
          system.userProxyAddress,
          {
            address: system.operationExecutor.address,
            calldata: system.operationExecutor.interface.encodeFunctionData('executeOp', [actions]),
          },
          signer,
        )

        gasEstimates.save(testName, txReceipt)

        if (!success) {
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

    testOperations(increaseMultipleOperations, operationRunner)

    beforeEach(async () => {
      config = await init()
      provider = config.provider
      signer = config.signer
      address = config.address

      const blockNumber = 13274574
      await resetNode(provider, blockNumber)

      const { system: _system, registry: _registry } = await deploySystem(config)
      system = _system
      registry = _registry

      exchangeDataMock = {
        to: system.exchangeInstance.address,
        data: 0,
      }

      oraclePrice = await getOraclePrice(provider)

      await system.exchangeInstance.setPrice(
        ADDRESSES.main.WETH,
        amountToWei(marketPrice).toFixed(0),
      )
    })

    after(() => {
      gasEstimates.print()
    })
  })
})
