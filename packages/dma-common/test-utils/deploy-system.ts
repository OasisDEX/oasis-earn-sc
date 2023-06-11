import { ADDRESSES } from '@deploy-configurations/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '@deploy-configurations/constants'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry, ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { logDebug } from '@dma-common/utils/common'
import { createDeploy } from '@dma-common/utils/deploy'
import { getDsProxyRegistry, getOrCreateProxy } from '@dma-common/utils/proxy'

import { RuntimeConfig, Unbox } from '../types/common'
import { loadDummyExchangeFixtures } from './dummy-exchange'

export async function deploySystem(config: RuntimeConfig, debug = false, useFallbackSwap = true) {
  const { provider, signer, address } = config
  console.log(`    \x1b[90mUsing fallback swap: ${useFallbackSwap}\x1b[0m`)
  const options = {
    debug,
    config,
  }
  debug && console.log('Deploying with address:', config.address)
  const deploy = await createDeploy(options)

  // Setup User
  debug && console.log('1/ Setting up user proxy')
  const dsProxyRegistryAddress = '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'
  const dsProxy = await getOrCreateProxy(
    await getDsProxyRegistry(signer, dsProxyRegistryAddress),
    config.signer,
  )

  // Deploy System Contracts
  debug && console.log('2/ Deploying system contracts')
  const [serviceRegistry, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
  const registry = new ServiceRegistry(serviceRegistryAddress, signer)

  const [operationExecutor, operationExecutorAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    [serviceRegistryAddress],
  )

  const [operationStorage, operationStorageAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    [serviceRegistryAddress, operationExecutorAddress],
  )

  const [operationRegistry, operationsRegistryAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    [],
  )

  // DPM
  const [accountGuard, accountGuardAddress] = await deploy('AccountGuard', [])
  const [accountFactory] = await deploy('AccountFactory', [accountGuardAddress])

  const tx = await accountFactory['createAccount()']()
  const receipt = await tx.wait()

  // eslint-disable-next-line
  const dpmProxyAddress: string = receipt.events![1].args!.proxy

  await accountGuard.setWhitelist(operationExecutorAddress, true)

  const [mcdView, mcdViewAddress] = await deploy(CONTRACT_NAMES.maker.MCD_VIEW, [])
  const [, chainLogViewAddress] = await deploy(CONTRACT_NAMES.maker.CHAINLOG_VIEW, [
    ADDRESSES[Network.MAINNET].maker.common.Chainlog,
  ])

  const [dummyExchange, dummyExchangeAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_EXCHANGE, [])

  const [uSwap, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
    address,
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
    0,
    serviceRegistryAddress,
  ])

  await uSwap.setPool(
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    10000,
  )
  await uSwap.addFeeTier(20)
  await uSwap.addFeeTier(7)

  const [swap, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
    address,
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
    0,
    serviceRegistryAddress,
  ])

  await swap.addFeeTier(20)
  await swap.addFeeTier(7)

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)
  const [dummyAutomation] = await deploy('DummyAutomation', [serviceRegistryAddress])
  const [dummyCommmand] = await deploy('DummyCommand', [serviceRegistryAddress])

  // Deploy Actions
  debug && console.log('3/ Deploying actions')
  //-- Common Actions
  const [positionCreatedAction, positionCreatedAddress] = await deploy(
    CONTRACT_NAMES.common.POSITION_CREATED,
    [],
  )
  const [swapAction, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])

  const [sendToken, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [
    serviceRegistryAddress,
  ])
  const [, dummyActionAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_ACTION, [
    serviceRegistryAddress,
  ])
  const [, dummyOptionalActionAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION, [
    serviceRegistryAddress,
  ])

  const [pullToken, pullTokenAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])

  const [setApproval, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [
    serviceRegistryAddress,
  ])
  const [cdpAllow, cdpAllowAddress] = await deploy(CONTRACT_NAMES.maker.CDP_ALLOW, [
    serviceRegistryAddress,
  ])

  const [actionFl, actionFlAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
    serviceRegistryAddress,
    ADDRESSES[Network.MAINNET].common.DAI,
  ])

  const [wrapEth, wrapActionAddress] = await deploy(CONTRACT_NAMES.common.WRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [unwrapEth, unwrapActionAddress] = await deploy(CONTRACT_NAMES.common.UNWRAP_ETH, [
    serviceRegistryAddress,
  ])

  const [returnFunds, returnFundsActionAddress] = await deploy(
    CONTRACT_NAMES.common.RETURN_FUNDS,
    [],
  )

  //-- Maker Actions
  const [actionOpenVault, actionOpenVaultAddress] = await deploy(CONTRACT_NAMES.maker.OPEN_VAULT, [
    serviceRegistryAddress,
  ])

  const [actionDeposit, actionDepositAddress] = await deploy(CONTRACT_NAMES.maker.DEPOSIT, [
    serviceRegistryAddress,
  ])

  const [actionPayback, actionPaybackAddress] = await deploy(CONTRACT_NAMES.maker.PAYBACK, [
    serviceRegistryAddress,
  ])

  const [actionWithdraw, actionWithdrawAddress] = await deploy(CONTRACT_NAMES.maker.WITHDRAW, [
    serviceRegistryAddress,
  ])

  const [actionGenerate, actionGenerateAddress] = await deploy(CONTRACT_NAMES.maker.GENERATE, [
    serviceRegistryAddress,
  ])

  //-- AAVE Actions
  const [depositInAAVEAction, actionDepositInAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.v2.DEPOSIT,
    [serviceRegistryAddress],
  )

  const [borrowInAAVEAction, actionAaveBorrowAddress] = await deploy(
    CONTRACT_NAMES.aave.v2.BORROW,
    [serviceRegistryAddress],
  )

  const [withdrawInAAVEAction, actionWithdrawFromAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.v2.WITHDRAW,
    [serviceRegistryAddress],
  )

  const [paybackInAAVEAction, actionPaybackFromAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.v2.PAYBACK,
    [serviceRegistryAddress],
  )

  //-- AAVE V3 Actions
  const [depositInAAVEV3Action, actionDepositInAAVEV3Address] = await deploy(
    CONTRACT_NAMES.aave.v3.DEPOSIT,
    [serviceRegistryAddress],
  )

  const [borrowInAAVEV3Action, actionAaveV3BorrowAddress] = await deploy(
    CONTRACT_NAMES.aave.v3.BORROW,
    [serviceRegistryAddress],
  )

  const [withdrawInAAVEV3Action, actionWithdrawFromAAVEV3Address] = await deploy(
    CONTRACT_NAMES.aave.v3.WITHDRAW,
    [serviceRegistryAddress],
  )

  const [paybackInAAVEV3Action, actionPaybackFromAAVEV3Address] = await deploy(
    CONTRACT_NAMES.aave.v3.PAYBACK,
    [serviceRegistryAddress],
  )

  const [setEModeInAAVEV3Action, actionSetEModeInAAVEV3Address] = await deploy(
    CONTRACT_NAMES.aave.v3.SET_EMODE,
    [serviceRegistryAddress],
  )

  debug && console.log('4/ Adding contracts to registry')
  //-- Add Token Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES[Network.MAINNET].common.DAI)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES[Network.MAINNET].common.WETH)

  // add flag to deploy fallbackSwap contract
  await registry.addEntry(CONTRACT_NAMES.common.SWAP, useFallbackSwap ? uSwapAddress : swapAddress)

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
  await registry.addEntry(CONTRACT_NAMES.common.EXCHANGE, dummyExchangeAddress)

  await registry.addEntry(CONTRACT_NAMES.common.CHAINLOG_VIEWER, chainLogViewAddress)

  const takeFlashLoanHash = await registry.addEntry(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    actionFlAddress,
  )
  const positionCreatedHash = await registry.addEntry(
    CONTRACT_NAMES.common.POSITION_CREATED,
    positionCreatedAddress,
  )
  const sendTokenHash = await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenAddress)
  await registry.addEntry(CONTRACT_NAMES.test.DUMMY_ACTION, dummyActionAddress)
  await registry.addEntry(CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION, dummyOptionalActionAddress)
  const pullTokenHash = await registry.addEntry(CONTRACT_NAMES.common.PULL_TOKEN, pullTokenAddress)
  const setApprovalHash = await registry.addEntry(
    CONTRACT_NAMES.common.SET_APPROVAL,
    setApprovalAddress,
  )

  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES[Network.MAINNET].common.OneInchAggregator,
  )

  const swapActionHash = await registry.addEntry(
    CONTRACT_NAMES.common.SWAP_ACTION,
    swapActionAddress,
  )
  const wrapEthHash = await registry.addEntry(CONTRACT_NAMES.common.WRAP_ETH, wrapActionAddress)
  const unwrapEthHash = await registry.addEntry(
    CONTRACT_NAMES.common.UNWRAP_ETH,
    unwrapActionAddress,
  )

  const returnFundsActionHash = await registry.addEntry(
    CONTRACT_NAMES.common.RETURN_FUNDS,
    returnFundsActionAddress,
  )

  //-- Add Maker Contract Entries
  await registry.addEntry(
    CONTRACT_NAMES.common.UNISWAP_ROUTER,
    ADDRESSES[Network.MAINNET].common.UniswapRouterV3,
  )
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_VIEW, mcdViewAddress)
  await registry.addEntry(
    CONTRACT_NAMES.maker.FLASH_MINT_MODULE,
    ADDRESSES[Network.MAINNET].maker.common.FlashMintModule,
  )
  await registry.addEntry(
    CONTRACT_NAMES.maker.MCD_MANAGER,
    ADDRESSES[Network.MAINNET].maker.common.CdpManager,
  )
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_JUG, ADDRESSES[Network.MAINNET].maker.common.Jug)
  await registry.addEntry(
    CONTRACT_NAMES.maker.MCD_JOIN_DAI,
    ADDRESSES[Network.MAINNET].maker.joins.MCD_JOIN_DAI,
  )
  const makerOpenVaultHash = await registry.addEntry(
    CONTRACT_NAMES.maker.OPEN_VAULT,
    actionOpenVaultAddress,
  )
  const makerDepositHash = await registry.addEntry(
    CONTRACT_NAMES.maker.DEPOSIT,
    actionDepositAddress,
  )
  const makerPaybackHash = await registry.addEntry(
    CONTRACT_NAMES.maker.PAYBACK,
    actionPaybackAddress,
  )
  const makerWithdrawHash = await registry.addEntry(
    CONTRACT_NAMES.maker.WITHDRAW,
    actionWithdrawAddress,
  )
  const makerGenerateHash = await registry.addEntry(
    CONTRACT_NAMES.maker.GENERATE,
    actionGenerateAddress,
  )

  await registry.addEntry(CONTRACT_NAMES.maker.CDP_ALLOW, cdpAllowAddress)

  //-- Add AAVE Contract Entries
  const aaveBorrowHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.BORROW,
    actionAaveBorrowAddress,
  )
  const aaveDepositHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.DEPOSIT,
    actionDepositInAAVEAddress,
  )
  const aaveWithdrawHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.WITHDRAW,
    actionWithdrawFromAAVEAddress,
  )
  const aavePaybackHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.PAYBACK,
    actionPaybackFromAAVEAddress,
  )

  if (!ADDRESSES[Network.MAINNET].aave.v2) throw new Error('Missing AAVE V2 addresses on mainnet')
  await registry.addEntry(
    CONTRACT_NAMES.aave.v2.WETH_GATEWAY,
    ADDRESSES[Network.MAINNET].aave.v2.WETHGateway,
  )
  await registry.addEntry(
    CONTRACT_NAMES.aave.v2.LENDING_POOL,
    ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
  )

  //-- Add AAVE V3 Contract Entries
  const aaveV3BorrowHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.BORROW,
    actionAaveV3BorrowAddress,
  )
  const aaveV3DepositHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.DEPOSIT,
    actionDepositInAAVEV3Address,
  )
  const aaveV3WithdrawHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.WITHDRAW,
    actionWithdrawFromAAVEV3Address,
  )
  const aaveV3PaybackHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.PAYBACK,
    actionPaybackFromAAVEV3Address,
  )
  const aaveV3SetEModeHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.SET_EMODE,
    actionSetEModeInAAVEV3Address,
  )
  await registry.addEntry(CONTRACT_NAMES.aave.v3.AAVE_POOL, ADDRESSES[Network.MAINNET].aave.v3.Pool)

  debug && console.log('5/ Adding operations to registry')
  // Add Maker Operations
  const operationsRegistry: OperationsRegistry = new OperationsRegistry(
    operationsRegistryAddress,
    signer,
  )

  await operationsRegistry.addOp(OPERATION_NAMES.maker.OPEN_AND_DRAW, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.OPEN_DRAW_AND_CLOSE, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: makerPaybackHash,
      optional: false,
    },
    {
      hash: makerWithdrawHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_TOP_UP, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_COLL_TOP_UP, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN, [
    {
      hash: makerOpenVaultHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: makerDepositHash,
      optional: false,
    },
    {
      hash: makerGenerateHash,
      optional: false,
    },
    {
      hash: sendTokenHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(
    OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP,
    [
      {
        hash: makerOpenVaultHash,
        optional: false,
      },
      {
        hash: pullTokenHash,
        optional: false,
      },
      {
        hash: makerDepositHash,
        optional: false,
      },
      {
        hash: pullTokenHash,
        optional: false,
      },
      {
        hash: pullTokenHash,
        optional: false,
      },
      {
        hash: makerDepositHash,
        optional: false,
      },
      {
        hash: takeFlashLoanHash,
        optional: false,
      },
      {
        hash: swapActionHash,
        optional: false,
      },
      {
        hash: makerDepositHash,
        optional: false,
      },
      {
        hash: makerGenerateHash,
        optional: false,
      },
      {
        hash: sendTokenHash,
        optional: false,
      },
    ],
  )

  // Add AAVE Operations
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.OPEN_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveBorrowHash,
      optional: false,
    },
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
    { hash: positionCreatedHash, optional: false },
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v3.OPEN_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3BorrowHash,
      optional: false,
    },
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3SetEModeHash,
      optional: true,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
    { hash: positionCreatedHash, optional: false },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.CLOSE_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aavePaybackHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v3.CLOSE_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3PaybackHash,
      optional: false,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
    {
      hash: aaveV3SetEModeHash,
      optional: true,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.INCREASE_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveBorrowHash,
      optional: false,
    },
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v3.ADJUST_RISK_UP, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3BorrowHash,
      optional: false,
    },
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.DEPOSIT_BORROW, [
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveBorrowHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.BORROW, [
    {
      hash: aaveBorrowHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.DEPOSIT, [
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW, [
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: swapActionHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveBorrowHash,
      optional: true,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: true,
    },
    {
      hash: positionCreatedHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.DECREASE_POSITION, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveDepositHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aavePaybackHash,
      optional: false,
    },
    {
      hash: aaveWithdrawHash,
      optional: false,
    },
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v3.ADJUST_RISK_DOWN, [
    {
      hash: takeFlashLoanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3DepositHash,
      optional: false,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
    {
      hash: swapActionHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: aaveV3PaybackHash,
      optional: false,
    },
    {
      hash: aaveV3WithdrawHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
    {
      hash: returnFundsActionHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.PAYBACK_WITHDRAW, [
    {
      hash: pullTokenHash,
      optional: true,
    },
    {
      hash: setApprovalHash,
      optional: true,
    },
    {
      hash: wrapEthHash,
      optional: true,
    },
    {
      hash: aavePaybackHash,
      optional: true,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: true,
    },
    {
      hash: aaveWithdrawHash,
      optional: true,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsActionHash,
      optional: true,
    },
  ])

  const deployedContracts = {
    common: {
      userProxyAddress: dsProxy.address,
      dsProxy,
      serviceRegistry,
      operationExecutor,
      operationStorage,
      operationRegistry,
      dummyAutomation,
      dummyCommmand,
      exchange: dummyExchange,
      // TODO: Figure out how to make this work based on the change
      uSwap,
      swap,
      swapAction,
      sendToken,
      pullToken,
      takeFlashLoan: actionFl,
      setApproval,
      wrapEth,
      unwrapEth,
      returnFunds: returnFunds,
      positionCreated: positionCreatedAction,
      accountGuard,
      accountFactory,
      dpmProxyAddress,
    },
    maker: {
      mcdView,
      openVault: actionOpenVault,
      deposit: actionDeposit,
      payback: actionPayback,
      withdraw: actionWithdraw,
      generate: actionGenerate,
      cdpAllow,
    },
    aave: {
      v2: {
        deposit: depositInAAVEAction,
        withdraw: withdrawInAAVEAction,
        borrow: borrowInAAVEAction,
        payback: paybackInAAVEAction,
      },
      v3: {
        deposit: depositInAAVEV3Action,
        withdraw: withdrawInAAVEV3Action,
        borrow: borrowInAAVEV3Action,
        payback: paybackInAAVEV3Action,
        eMode: setEModeInAAVEV3Action,
      },
    },
  }

  if (debug) {
    console.log('6/ Debugging...')
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.common.exchange.address}`,
      `Swap address: ${deployedContracts.common.swap.address}`,
      `User Proxy Address: ${deployedContracts.common.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.common.dsProxy.address}`,
      `Registry address: ${deployedContracts.common.serviceRegistry.address}`,
      `Operation Executor address: ${deployedContracts.common.operationExecutor.address}`,
      `Operation Storage address: ${deployedContracts.common.operationStorage.address}`,
      `Operations Registry address: ${deployedContracts.common.operationRegistry.address}`,
      `Send Token address: ${deployedContracts.common.sendToken.address}`,
      `Pull Token address: ${deployedContracts.common.pullToken.address}`,
      `Flashloan Action address: ${deployedContracts.common.takeFlashLoan.address}`,
      `Swap Action address: ${deployedContracts.common.swapAction.address}`,
      `Return Funds Action address: ${deployedContracts.common.returnFunds.address}`,
      `Position Created Action address: ${deployedContracts.common.positionCreated.address}`,
      `MCDView address: ${deployedContracts.maker.mcdView.address}`,
      `OpenVault Action address: ${deployedContracts.maker.openVault.address}`,
      `Deposit Action address: ${deployedContracts.maker.deposit.address}`,
      `Payback Action address: ${deployedContracts.maker.payback.address}`,
      `Withdraw Action address: ${deployedContracts.maker.withdraw.address}`,
      `Generate Action address: ${deployedContracts.maker.generate.address}`,

      `AAVE|Deposit Action address: ${deployedContracts.aave.v2.deposit.address}`,
      `AAVE|Withdraw Action address: ${deployedContracts.aave.v2.withdraw.address}`,
      `AAVE|Borrow Action address: ${deployedContracts.aave.v2.borrow.address}`,
      `AAVE|Payback Action address: ${deployedContracts.aave.v2.payback.address}`,

      `AAVE_V3|Deposit Action address: ${deployedContracts.aave.v3.deposit.address}`,
      `AAVE_V3|Withdraw Action address: ${deployedContracts.aave.v3.withdraw.address}`,
      `AAVE_V3|Borrow Action address: ${deployedContracts.aave.v3.borrow.address}`,
      `AAVE_V3|Payback Action address: ${deployedContracts.aave.v3.payback.address}`,
      `AAVE_V3|eMode Action address: ${deployedContracts.aave.v3.eMode.address}`,
    ])
  }

  return { system: deployedContracts, registry }
}

export type DeployedSystemInfo = Unbox<ReturnType<typeof deploySystem>>['system']
