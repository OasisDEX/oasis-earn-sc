import { ethers } from 'hardhat'

import DSProxyABI from '../abi/ds-proxy.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../helpers/constants'
import { createDeploy } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { loadDummyExchangeFixtures } from '../helpers/swap/DummyExchange'
import { RuntimeConfig, Unbox } from '../helpers/types/common'
import { logDebug } from '../helpers/utils'
import { OperationsRegistry } from '../helpers/wrappers/operationsRegistry'
import { ServiceRegistry } from '../helpers/wrappers/serviceRegistry'

export async function deploySystem(config: RuntimeConfig, debug = false) {
  const { provider, signer, address } = config

  const options = {
    debug,
    config,
  }
  const deploy = await createDeploy(options)

  // Setup User
  debug && console.log('1/ Setting up user proxy')
  const proxyAddress = await getOrCreateProxy(signer)
  const dsProxy = new ethers.Contract(proxyAddress, DSProxyABI, provider).connect(signer)

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
    [serviceRegistryAddress],
  )

  const [operationRegistry, operationsRegistryAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    [],
  )

  const [mcdView, mcdViewAddress] = await deploy(CONTRACT_NAMES.maker.MCD_VIEW, [])

  const [dummyExchange, dummyExchangeAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_EXCHANGE, [])

  const [uSwap, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
    address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])
  await uSwap.setPool(
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    10000,
  )

  const [swap, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
    address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)
  const [dummyAutomation, dummyAutomationAddress] = await deploy('DummyAutomation', [
    serviceRegistryAddress,
  ])

  // Deploy Actions
  debug && console.log('3/ Deploying actions')
  //-- Common Actions
  const [swapAction, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])

  const [sendToken, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [])

  const [pullToken, pullTokenAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])

  const [setApproval, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [])
  const [cdpAllow, cdpAllowAddress] = await deploy(CONTRACT_NAMES.maker.CDP_ALLOW, [
    serviceRegistryAddress,
  ])

  const [actionFl, actionFlAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
    serviceRegistryAddress,
  ])

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
    CONTRACT_NAMES.aave.DEPOSIT,
    [serviceRegistryAddress],
  )

  const [borrowInAAVEAction, actionAaveBorrowAddress] = await deploy(CONTRACT_NAMES.aave.BORROW, [
    serviceRegistryAddress,
  ])

  const [withdrawInAAVEAction, actionWithdrawFromAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.WITHDRAW,
    [serviceRegistryAddress],
  )

  debug && console.log('4/ Adding contracts to registry')
  //-- Add Token Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)

  // add flag to deploy dummySwap
  const useDummySwap = true
  const swapHash = await registry.addEntry(
    CONTRACT_NAMES.common.SWAP,
    useDummySwap ? uSwapAddress : swapAddress,
  )

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
  await registry.addEntry(CONTRACT_NAMES.common.EXCHANGE, dummyExchangeAddress)
  const takeFlashLoanHash = await registry.addEntry(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    actionFlAddress,
  )
  const sendTokenHash = await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenAddress)
  const pullTokenHash = await registry.addEntry(CONTRACT_NAMES.common.PULL_TOKEN, pullTokenAddress)
  const setApprovalHash = await registry.addEntry(
    CONTRACT_NAMES.common.SET_APPROVAL,
    setApprovalAddress,
  )

  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  const swapActionHash = await registry.addEntry(
    CONTRACT_NAMES.common.SWAP_ACTION,
    swapActionAddress,
  )

  //-- Add Maker Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.UNISWAP_ROUTER, ADDRESSES.main.uniswapRouterV3)
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_VIEW, mcdViewAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.maker.fmm)
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_MANAGER, ADDRESSES.main.maker.cdpManager)
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_JUG, ADDRESSES.main.maker.jug)
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_JOIN_DAI, ADDRESSES.main.maker.joinDAI)
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

  const makerCdpAllowHash = await registry.addEntry(CONTRACT_NAMES.maker.CDP_ALLOW, cdpAllowAddress)

  //-- Add AAVE Contract Entries
  const aaveBorrowHash = await registry.addEntry(
    CONTRACT_NAMES.aave.BORROW,
    actionAaveBorrowAddress,
  )
  const aaveDepositHash = await registry.addEntry(
    CONTRACT_NAMES.aave.DEPOSIT,
    actionDepositInAAVEAddress,
  )
  const aaveWithdrawHash = await registry.addEntry(
    CONTRACT_NAMES.aave.WITHDRAW,
    actionWithdrawFromAAVEAddress,
  )
  const aaveWethGatewayHash = await registry.addEntry(
    CONTRACT_NAMES.aave.WETH_GATEWAY,
    ADDRESSES.main.aave.WETHGateway,
  )
  const aaveLendingPoolHash = await registry.addEntry(
    CONTRACT_NAMES.aave.LENDING_POOL,
    ADDRESSES.main.aave.MainnetLendingPool,
  )

  debug && console.log('5/ Adding operations to registry')
  // Add Maker Operations
  const operationsRegistry: OperationsRegistry = new OperationsRegistry(
    operationsRegistryAddress,
    signer,
  )
  await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

  await operationsRegistry.addOp(OPERATION_NAMES.maker.OPEN_AND_DRAW, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    makerGenerateHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.OPEN_DRAW_AND_CLOSE, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    makerGenerateHash,
    makerPaybackHash,
    makerWithdrawHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    makerGenerateHash,
    swapActionHash,
    makerDepositHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_TOP_UP, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    pullTokenHash,
    makerGenerateHash,
    swapActionHash,
    makerDepositHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_COLL_TOP_UP, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    pullTokenHash,
    makerDepositHash,
    makerGenerateHash,
    swapActionHash,
    makerDepositHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    pullTokenHash,
    pullTokenHash,
    makerDepositHash,
    makerGenerateHash,
    swapActionHash,
    makerDepositHash,
  ])
  await operationsRegistry.addOp(OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN, [
    makerOpenVaultHash,
    pullTokenHash,
    makerDepositHash,
    takeFlashLoanHash,
    // pullTokenHash,
    swapActionHash,
    makerDepositHash,
    makerGenerateHash,
    sendTokenHash,
  ])
  await operationsRegistry.addOp(
    OPERATION_NAMES.maker.INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP,
    [
      makerOpenVaultHash,
      pullTokenHash,
      makerDepositHash,
      pullTokenHash,
      pullTokenHash,
      makerDepositHash,
      takeFlashLoanHash,
      // pullTokenHash,
      swapActionHash,
      makerDepositHash,
      makerGenerateHash,
      sendTokenHash,
    ],
  )

  // Add AAVE Operations
  await operationsRegistry.addOp(OPERATION_NAMES.aave.OPEN_POSITION, [
    pullTokenHash,
    takeFlashLoanHash,
    // pullTokenHash,
    setApprovalHash,
    aaveDepositHash,
    aaveBorrowHash,
    swapHash,
    aaveWithdrawHash,
    sendTokenHash,
  ])

  const deployedContracts = {
    common: {
      userProxyAddress: proxyAddress,
      dsProxy,
      serviceRegistry,
      operationExecutor,
      operationStorage,
      operationRegistry,
      dummyAutomation,
      exchange: dummyExchange,
      swap: useDummySwap ? uSwap : swap,
      swapAction,
      sendToken,
      pullToken,
      takeFlashLoan: actionFl,
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
      deposit: depositInAAVEAction,
      withdraw: withdrawInAAVEAction,
      borrow: borrowInAAVEAction,
    },
  }

  if (debug) {
    console.log('6/ Debugging...')
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.common.exchange.address}`,
      `User Proxy Address: ${deployedContracts.common.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.common.dsProxy.address}`,
      `Registry address: ${deployedContracts.common.serviceRegistry.address}`,
      `Operation Executor address: ${deployedContracts.common.operationExecutor.address}`,
      `Operation Storage address: ${deployedContracts.common.operationStorage.address}`,
      `Operations Registry address: ${deployedContracts.common.operationRegistry.address}`,
      `Send Token address: ${deployedContracts.common.sendToken.address}`,
      `Pull Token address: ${deployedContracts.common.pullToken.address}`,
      `Flashloan Action address: ${deployedContracts.common.takeFlashLoan.address}`,
      `Swap Action address: ${deployedContracts.common.swap.address}`,

      `MCDView address: ${deployedContracts.maker.mcdView.address}`,
      `OpenVault Action address: ${deployedContracts.maker.openVault.address}`,
      `Depost Action address: ${deployedContracts.maker.deposit.address}`,
      `Payback Action address: ${deployedContracts.maker.payback.address}`,
      `Withdraw Action address: ${deployedContracts.maker.withdraw.address}`,
      `Generate Action address: ${deployedContracts.maker.generate.address}`,

      `AAVE|Borrow Action address: ${deployedContracts.aave.borrow.address}`,
      `AAVE|Deposit Action address: ${deployedContracts.aave.deposit.address}`,
      `AAVE|Withdraw Action address: ${deployedContracts.aave.withdraw.address}`,
    ])
  }

  return { system: deployedContracts, registry }
}

export type DeployedSystemInfo = Unbox<ReturnType<typeof deploySystem>>['system']
