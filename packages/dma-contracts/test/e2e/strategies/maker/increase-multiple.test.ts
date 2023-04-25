import { executeThroughProxy } from '@dma-common/utils/execute'
import { testBlockNumber } from '@dma-contracts/test/config'
import { initialiseConfig } from '@dma-contracts/test/fixtures'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import CDPManagerABI from '@oasisdex/abis/external/protocols/maker/dss-cdp-manager.json'
import ERC20ABI from '@oasisdex/abis/external/tokens/IERC20.json'
import { OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import {
  calculateParamsIncreaseMP,
  DeployedSystemInfo,
  expect,
  GasEstimateHelper,
  gasEstimateHelper,
  prepareMultiplyParameters,
  restoreSnapshot,
} from '@oasisdex/dma-common/test-utils'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, ensureWeiFormat } from '@oasisdex/dma-common/utils/common'
import { getLastVault, getOraclePrice, getVaultInfo } from '@oasisdex/dma-common/utils/maker'
import { ADDRESSES } from '@oasisdex/dma-deployments'
import { CONTRACT_NAMES } from '@oasisdex/dma-deployments/constants'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { ServiceRegistry } from '@oasisdex/dma-deployments/utils/wrappers'
import { ActionCall, ActionFactory, calldataTypes } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { loadFixture } from 'ethereum-waffle'
import { ethers, Signer } from 'ethers'

const LENDER_FEE = new BigNumber(0)

const createAction = ActionFactory.create

let DAI: Contract
let WETH: Contract

/**
 * Skipped until Maker operations more relevant.
 * Also fails due to issue with getOracleProvider and hardhat version.
 * Requires hardhat v2.9.5 or greater
 * Currently only hardhat v2.8.0 is tested as working well with tenderly export
 * */
describe.skip(`Operations | Maker | Increase Multiple | E2E`, async () => {
  const oazoFee = 2 // divided by base (10000), 1 = 0.01%;
  const oazoFeePct = new BigNumber(oazoFee).div(10000)
  const marketPrice = new BigNumber(1582)
  const flashLoanFee = LENDER_FEE
  const slippage = new BigNumber(0.0001) // percentage

  let provider: JsonRpcProvider
  let signer: Signer
  let address: string
  let system: DeployedSystemInfo
  let exchangeDataMock: { to: string; data: number }
  let registry: ServiceRegistry
  let config: RuntimeConfig
  let oraclePrice: BigNumber

  before(async () => {
    ;({ config, provider, signer, address } = await loadFixture(initialiseConfig))

    DAI = new ethers.Contract(ADDRESSES[Network.MAINNET].common.DAI, ERC20ABI, provider).connect(
      signer,
    )
    WETH = new ethers.Contract(ADDRESSES[Network.MAINNET].common.WETH, ERC20ABI, provider).connect(
      signer,
    )

    const { snapshot } = await restoreSnapshot({
      config,
      provider,
      blockNumber: testBlockNumber,
      useFallbackSwap: true,
    })

    system = snapshot.deployed.system
    registry = snapshot.deployed.registry

    exchangeDataMock = {
      to: system.common.exchange.address,
      data: 0,
    }

    oraclePrice = await getOraclePrice(provider)

    await system.common.exchange.setPrice(
      ADDRESSES[Network.MAINNET].common.WETH,
      amountToWei(marketPrice).toFixed(0),
    )
  })

  afterEach(async () => {
    await restoreSnapshot({ config, provider, blockNumber: testBlockNumber })
  })

  let gasEstimates: GasEstimateHelper

  it(`should open vault, deposit ETH and increase multiple`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(0)
    const collTopUp = new BigNumber(0)
    const requiredCollRatio = new BigNumber(5)

    gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
      skipFL: false,
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    // Generate DAI -> Swap for collateral -> Deposit collateral
    const generateDaiForSwap = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const collateralToDeposit = desiredCdpState.toBorrowCollateralAmount.plus(
      desiredCdpState.collTopUp,
    )
    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(collateralToDeposit),
        },
        [0, 1, 4],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      generateDaiForSwap,
      swapAction,
      depositBorrowedCollateral,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  it(`should open vault, deposit ETH and increase multiple & [+Flashloan]`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(0)
    const collTopUp = new BigNumber(0)
    const requiredCollRatio = new BigNumber(2.5)

    gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
      skipFL: false,
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    // Get flashloan -> Swap for collateral -> Deposit collateral -> Generate DAI -> Repay flashloan

    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    // TODO: Move funds to proxy
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.toBorrowCollateralAmount),
        },
        [0, 1, 3],
      ],
    )

    const generateDaiToRepayFL = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const sendBackDAI = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
      [calldataTypes.common.SendToken, calldataTypes.paramsMap],
      [
        {
          amount: exchangeData.fromTokenAmount,
          asset: ADDRESSES[Network.MAINNET].common.DAI,
          to: system.common.operationExecutor.address,
        },
        [0, 0, 0],
      ],
    )

    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: exchangeData.fromTokenAmount,
          isProxyFlashloan: true,
          isDPMProxy: false,
          calls: [swapAction, depositBorrowedCollateral, generateDaiToRepayFL, sendBackDAI],
        },
        [0, 0, 0, 0],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      takeAFlashloan,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  it(`should open vault, deposit ETH and increase multiple & [+Coll topup]`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(0)
    const collTopUp = new BigNumber(10)
    const requiredCollRatio = new BigNumber(5)

    gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: new BigNumber(ensureWeiFormat(initialColl)).toFixed(0),
        },
        [0, 1, 0],
      ],
    )

    const transferCollTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: exchangeData?.toTokenAddress,
          from: address,
          amount: new BigNumber(ensureWeiFormat(desiredCdpState.collTopUp)).toFixed(0),
        },
        [0, 0, 0],
      ],
    )

    const topupCollateralAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: new BigNumber(ensureWeiFormat(collTopUp)).toFixed(0),
        },
        [0, 1, 0],
      ],
    )

    // Generate DAI -> Swap for collateral -> Deposit collateral
    const generateDaiForSwap = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const collateralToDeposit = desiredCdpState.toBorrowCollateralAmount
    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(collateralToDeposit),
        },
        [0, 1, 5],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      transferCollTopupToProxyAction,
      topupCollateralAction,
      generateDaiForSwap,
      swapAction,
      depositBorrowedCollateral,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_COLL_TOP_UP,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  it(`should open vault, deposit ETH and increase multiple & [+Coll topup, +DAI topup]`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(20000)
    const collTopUp = new BigNumber(10)
    const requiredCollRatio = new BigNumber(5)

    const gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
      skipFL: false,
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
          amount: new BigNumber(ensureWeiFormat(initialColl)).toFixed(0),
        },
        [0],
      ],
    )

    const initialDepositAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    const transferDaiTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: DAI.address,
          from: address,
          amount: ensureWeiFormat(desiredCdpState.daiTopUp),
        },
        [0, 0, 0],
      ],
    )

    const transferCollTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: exchangeData?.toTokenAddress,
          from: address,
          amount: ensureWeiFormat(desiredCdpState.collTopUp),
        },
        [0, 0, 0],
      ],
    )

    const topupCollateralAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.collTopUp),
        },
        [0, 1, 0],
      ],
    )

    // Generate DAI -> Swap for collateral -> Deposit collateral
    const generateDaiForSwap = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const collateralToDeposit = desiredCdpState.toBorrowCollateralAmount

    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(collateralToDeposit),
        },
        // Map values to the params above as if in order
        [0, 1, 5],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      transferDaiTopupToProxyAction,
      transferCollTopupToProxyAction,
      topupCollateralAction,
      generateDaiForSwap,
      swapAction,
      depositBorrowedCollateral,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)

    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  it(`should open vault, deposit ETH and increase multiple & [+DAI topup]`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(20000)
    const collTopUp = new BigNumber(0)
    const requiredCollRatio = new BigNumber(5)

    const gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
      skipFL: false,
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    const transferDaiTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: DAI.address,
          from: address,
          amount: ensureWeiFormat(desiredCdpState.daiTopUp),
        },
        [0, 0, 0],
      ],
    )

    // Generate DAI -> Swap for collateral -> Deposit collateral
    const generateDaiForSwap = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const collateralToDeposit = desiredCdpState.toBorrowCollateralAmount.plus(
      desiredCdpState.collTopUp,
    )
    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(collateralToDeposit),
        },
        [0, 1, 4],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      transferDaiTopupToProxyAction,
      generateDaiForSwap,
      swapAction,
      depositBorrowedCollateral,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_TOP_UP,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  it(`should open vault, deposit ETH and increase multiple & [+Flashloan, +Coll topup, +DAI topup]`, async () => {
    // Test set up values
    const initialColl = new BigNumber(100)
    const initialDebt = new BigNumber(0)
    const daiTopUp = new BigNumber(20000)
    const collTopUp = new BigNumber(10)
    const requiredCollRatio = new BigNumber(2)

    const gasEstimates = gasEstimateHelper()

    await WETH.approve(
      system.common.userProxyAddress,
      amountToWei(initialColl.plus(collTopUp)).toFixed(0),
    )

    await DAI.approve(system.common.userProxyAddress, amountToWei(daiTopUp).toFixed(0))

    const { requiredDebt, additionalCollateral, preIncreaseMPTopUp } = calculateParamsIncreaseMP({
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
      skipFL: false,
    })

    const openVaultAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.OPEN_VAULT),
      [calldataTypes.maker.Open, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
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
          asset: ADDRESSES[Network.MAINNET].common.WETH,
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
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(initialColl),
        },
        [0, 1, 0],
      ],
    )

    const transferDaiTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: DAI.address,
          from: address,
          amount: ensureWeiFormat(desiredCdpState.daiTopUp),
        },
        [0, 0, 0],
      ],
    )

    const transferCollTopupToProxyAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.PULL_TOKEN),
      [calldataTypes.common.PullToken, calldataTypes.paramsMap],
      [
        {
          asset: exchangeData?.toTokenAddress,
          from: address,
          amount: ensureWeiFormat(desiredCdpState.collTopUp),
        },
        [0, 0, 0],
      ],
    )

    const topupCollateralAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(collTopUp),
        },
        [0, 1, 0],
      ],
    )

    // Get flashloan -> Swap for collateral -> Deposit collateral -> Generate DAI -> Repay flashloan
    const swapAmount = new BigNumber(exchangeData.fromTokenAmount)
      .plus(ensureWeiFormat(desiredCdpState.daiTopUp))
      .toFixed(0)

    const swapData = {
      fromAsset: exchangeData.fromTokenAddress,
      toAsset: exchangeData.toTokenAddress,
      // Add daiTopup amount to swap
      amount: swapAmount,
      receiveAtLeast: exchangeData.minToTokenAmount,
      fee: 0,
      withData: exchangeData._exchangeCalldata,
      collectFeeInFromToken: true,
    }

    await DAI.approve(system.common.userProxyAddress, swapAmount)
    // TODO: Move funds to proxy
    const swapAction = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SWAP_ACTION),
      [calldataTypes.common.Swap],
      [swapData],
    )

    const depositBorrowedCollateral = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.DEPOSIT),
      [calldataTypes.maker.Deposit, calldataTypes.paramsMap],
      [
        {
          joinAddress: ADDRESSES[Network.MAINNET].maker.JoinETH_A,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.toBorrowCollateralAmount),
        },
        [0, 1, 4],
      ],
    )

    const generateDaiToRepayFL = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.maker.GENERATE),
      [calldataTypes.maker.Generate, calldataTypes.paramsMap],
      [
        {
          to: system.common.userProxyAddress,
          vaultId: 0,
          amount: ensureWeiFormat(desiredCdpState.requiredDebt),
        },
        [0, 1, 0],
      ],
    )

    const sendBackDAI = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.SEND_TOKEN),
      [calldataTypes.common.SendToken],
      [
        {
          amount: exchangeData.fromTokenAmount,
          asset: ADDRESSES[Network.MAINNET].common.DAI,
          to: system.common.operationExecutor.address,
        },
        [0, 0, 0],
      ],
    )

    const takeAFlashloan = createAction(
      await registry.getEntryHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
      [calldataTypes.common.TakeAFlashLoan, calldataTypes.paramsMap],
      [
        {
          amount: exchangeData.fromTokenAmount,
          isProxyFlashloan: true,
          isDPMProxy: false,
          calls: [swapAction, depositBorrowedCollateral, generateDaiToRepayFL, sendBackDAI],
        },
        [0, 0, 0, 0],
      ],
    )

    const actions: ActionCall[] = [
      openVaultAction,
      pullTokenIntoProxyAction,
      initialDepositAction,
      transferDaiTopupToProxyAction,
      transferCollTopupToProxyAction,
      topupCollateralAction,
      takeAFlashloan,
    ]

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, txReceipt] = await executeThroughProxy(
      system.common.userProxyAddress,
      {
        address: system.common.operationExecutor.address,
        calldata: system.common.operationExecutor.interface.encodeFunctionData('executeOp', [
          actions,
          OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP,
        ]),
      },
      signer,
    )

    gasEstimates.save(txReceipt)

    const vault = await getLastVault(provider, signer, system.common.userProxyAddress)
    const info = await getVaultInfo(system.maker.mcdView, vault.id, vault.ilk)
    const currentCollRatio = info.coll.times(oraclePrice).div(info.debt)

    expect.toBe(currentCollRatio, 'gte', requiredCollRatio)

    const expectedColl = additionalCollateral.plus(initialColl).plus(preIncreaseMPTopUp)
    const expectedDebt = desiredCdpState.requiredDebt

    expect.toBe(info.coll.toFixed(0), 'gte', expectedColl.toFixed(0))
    expect.toBeEqual(info.debt.toFixed(0), expectedDebt.toFixed(0))

    const cdpManagerContract = new ethers.Contract(
      ADDRESSES[Network.MAINNET].maker.CdpManager,
      CDPManagerABI,
      provider,
    ).connect(signer)
    const vaultOwner = await cdpManagerContract.owns(vault.id)
    expect.toBeEqual(vaultOwner, system.common.userProxyAddress)
  })

  afterEach(() => {
    gasEstimates.print()
  })
})
