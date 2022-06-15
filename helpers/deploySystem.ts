import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import DSProxyABI from '../abi/ds-proxy.json'
import { ADDRESSES } from './addresses'
import { CONTRACT_NAMES } from './constants'
import { deploy } from './deploy'
import { getOrCreateProxy } from './proxy'
import { loadDummyExchangeFixtures } from './swap/DummyExchange'
import { RuntimeConfig } from './types/common'
import { logDebug, ServiceRegistry } from './utils'

export interface DeployedSystemInfo {
  userProxyAddress: string
  mcdViewInstance: Contract
  exchangeInstance: Contract
  dsProxyInstance: Contract
  daiTokenInstance: Contract
  gems: {
    wethTokenInstance: Contract
  }
  actionOpenVault: Contract
  actionTakeFlashLoan: Contract
  actionDeposit: Contract
  actionPayback: Contract
  actionWithdraw: Contract
  actionGenerate: Contract
  actionSendToken: Contract
  actionPullToken: Contract
  actionSwap: Contract
  actionDummySwap: Contract
  actionDepositInAAVE: Contract
  actionBorrowInAAVE: Contract
  actionWithdrawInAAVE: Contract
  operationExecutor: Contract
  operationStorage: Contract
  serviceRegistry: Contract
}

export async function deploySystem(
  config: RuntimeConfig,
  debug = false,
): Promise<{ system: DeployedSystemInfo; registry: ServiceRegistry }> {
  const { provider, signer, address } = config

  const options = {
    debug,
    config,
  }

  const deployedContracts: Partial<DeployedSystemInfo> = {}

  // Setup User
  debug && console.log('1/ Setting up user proxy')
  const proxyAddress = await getOrCreateProxy(signer)
  deployedContracts.userProxyAddress = proxyAddress
  deployedContracts.dsProxyInstance = new ethers.Contract(
    proxyAddress,
    DSProxyABI,
    provider,
  ).connect(signer)

  // Deploy System Contracts
  debug && console.log('2/ Deploying system contracts')
  const [serviceRegistry, serviceRegistryAddress] = await deploy('ServiceRegistry', [0], options)
  const registry = new ServiceRegistry(serviceRegistryAddress, signer)
  deployedContracts.serviceRegistry = serviceRegistry

  const [operationExecutor, operationExecutorAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.operationExecutor = operationExecutor

  const [operationStorage, operationStorageAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    [],
    options,
  )
  deployedContracts.operationStorage = operationStorage

  const [mcdView, mcdViewAddress] = await deploy(CONTRACT_NAMES.maker.MCD_VIEW, [], options)
  deployedContracts.mcdViewInstance = mcdView

  const [dummyExchange, dummyExchangeAddress] = await deploy(
    CONTRACT_NAMES.test.DUMMY_EXCHANGE,
    [],
    options,
  )
  deployedContracts.exchangeInstance = dummyExchange

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)

  // Deploy Actions
  debug && console.log('3/ Deploying actions')
  //-- Common Actions
  const [dummySwap, dummySwapAddress] = await deploy(
    CONTRACT_NAMES.test.DUMMY_SWAP,
    [serviceRegistryAddress, ADDRESSES.main.WETH, dummyExchangeAddress],
    options,
  )
  deployedContracts.actionDummySwap = dummySwap

  const [swap, swapAddress] = await deploy(
    CONTRACT_NAMES.common.SWAP_ON_ONE_INCH,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionSwap = swap

  const [sendToken, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [], options)
  deployedContracts.actionSendToken = sendToken

  const [pullToken, pullTokenAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [], options)
  deployedContracts.actionPullToken = pullToken

  const [actionFl, actionFlAddress] = await deploy(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionTakeFlashLoan = actionFl

  //-- Maker Actions
  const [actionOpenVault, actionOpenVaultAddress] = await deploy(
    CONTRACT_NAMES.maker.OPEN_VAULT,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionOpenVault = actionOpenVault

  const [actionDeposit, actionDepositAddress] = await deploy(
    CONTRACT_NAMES.maker.DEPOSIT,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionDeposit = actionDeposit

  const [actionPayback, actionPaybackAddress] = await deploy(
    CONTRACT_NAMES.maker.PAYBACK,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionPayback = actionPayback

  const [actionWithdraw, actionWithdrawAddress] = await deploy(
    CONTRACT_NAMES.maker.WITHDRAW,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionWithdraw = actionWithdraw

  const [actionGenerate, actionGenerateAddress] = await deploy(
    CONTRACT_NAMES.maker.GENERATE,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionGenerate = actionGenerate

  //-- AAVE Actions
  const [depositInAAVEAction, actionDepositInAAVEAddress] = await deploy(
    'DepositInAAVE',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionDepositInAAVE = depositInAAVEAction
  const [borrowInAAVEAction, actionAaveBorrowAddress] = await deploy(
    'AaveBorrow',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionBorrowInAAVE = borrowInAAVEAction
  const [withdrawInAAVEAction, actionWithdrawFromAAVEAddress] = await deploy(
    'WithdrawFromAAVE',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionWithdrawInAAVE = withdrawInAAVEAction

  debug && console.log('4/ Adding contracts to registry')
  //-- Add Token Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)

  //-- Add Test Contract Entries
  await registry.addEntry(CONTRACT_NAMES.test.DUMMY_SWAP, dummySwapAddress)

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.EXCHANGE, dummyExchangeAddress)
  await registry.addEntry(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, actionFlAddress)
  await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenAddress)
  await registry.addEntry(CONTRACT_NAMES.common.PULL_TOKEN, pullTokenAddress)
  await registry.addEntry(CONTRACT_NAMES.common.SWAP_ON_ONE_INCH, swapAddress)
  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  //-- Add Maker Contract Entries
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_VIEW, mcdViewAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.fmm)
  await registry.addEntry(CONTRACT_NAMES.maker.OPEN_VAULT, actionOpenVaultAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.DEPOSIT, actionDepositAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.PAYBACK, actionPaybackAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.WITHDRAW, actionWithdrawAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.GENERATE, actionGenerateAddress)

  //-- Add AAVE Contract Entries
  await registry.addEntry(CONTRACT_NAMES.aave.BORROW, actionAaveBorrowAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.DEPOSIT, actionDepositInAAVEAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.WITHDRAW, actionWithdrawFromAAVEAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.AAVE_WETH_GATEWAY, ADDRESSES.main.AAVEWETHGateway)

  if (debug) {
    console.log('5/ Debugging...')
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.exchangeInstance.address}`,
      `User Proxy Address: ${deployedContracts.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.dsProxyInstance.address}`,
      `Registry address: ${deployedContracts.serviceRegistry.address}`,
      `Operation Executor address: ${deployedContracts.operationExecutor.address}`,
      `Operator Storage address: ${deployedContracts.operationStorage.address}`,
      `Send Token address: ${deployedContracts.actionSendToken.address}`,
      `Pull Token address: ${deployedContracts.actionPullToken.address}`,
      `Flashloan Action address: ${deployedContracts.actionTakeFlashLoan.address}`,

      `MCDView address: ${deployedContracts.mcdViewInstance.address}`,
      `OpenVault Action address: ${deployedContracts.actionOpenVault.address}`,
      `Depost Action address: ${deployedContracts.actionDeposit.address}`,
      `Payback Action address: ${deployedContracts.actionPayback.address}`,
      `Withdraw Action address: ${deployedContracts.actionWithdraw.address}`,
      `Generate Action address: ${deployedContracts.actionGenerate.address}`,

      `AAVE|Borrow Action address: ${deployedContracts.actionBorrowInAAVE.address}`,
      `AAVE|Deposit Action address: ${deployedContracts.actionDepositInAAVE.address}`,
      `AAVE|Withdraw Action address: ${deployedContracts.actionWithdrawInAAVE.address}`,
    ])
  }

  return { system: deployedContracts as DeployedSystemInfo, registry }
}
