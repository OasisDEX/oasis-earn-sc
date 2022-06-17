import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import DSProxyABI from '../abi/ds-proxy.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_LABELS } from '../helpers/constants'
import { deploy } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { loadDummyExchangeFixtures } from '../helpers/swap/DummyExchange'
import { RuntimeConfig } from '../helpers/types/common'
import { logDebug, ServiceRegistry } from '../helpers/utils'

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
    'OperationExecutor',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.operationExecutor = operationExecutor

  const [operationStorage, operationStorageAddress] = await deploy('OperationStorage', [], options)
  deployedContracts.operationStorage = operationStorage

  const [mcdView, mcdViewAddress] = await deploy('McdView', [], options)
  deployedContracts.mcdViewInstance = mcdView

  const [dummyExchange, dummyExchangeAddress] = await deploy('DummyExchange', [], options)
  deployedContracts.exchangeInstance = dummyExchange

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)

  // Deploy Actions
  debug && console.log('3/ Deploying actions')
  //-- Common Actions
  const [dummySwap, dummySwapAddress] = await deploy(
    'DummySwap',
    [serviceRegistryAddress, ADDRESSES.main.WETH, dummyExchangeAddress],
    options,
  )
  deployedContracts.actionDummySwap = dummySwap

  const [swap, swapAddress] = await deploy('SwapOnOneInch', [serviceRegistryAddress], options)
  deployedContracts.actionSwap = swap

  const [sendToken, sendTokenAddress] = await deploy('SendToken', [], options)
  deployedContracts.actionSendToken = sendToken

  const [pullToken, pullTokenAddress] = await deploy('PullToken', [], options)
  deployedContracts.actionPullToken = pullToken

  const [actionFl, actionFlAddress] = await deploy(
    'TakeFlashloan',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionTakeFlashLoan = actionFl

  //-- Maker Actions
  const [actionOpenVault, actionOpenVaultAddress] = await deploy(
    'OpenVault',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionOpenVault = actionOpenVault

  const [actionDeposit, actionDepositAddress] = await deploy(
    'Deposit',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionDeposit = actionDeposit

  const [actionPayback, actionPaybackAddress] = await deploy(
    'Payback',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionPayback = actionPayback

  const [actionWithdraw, actionWithdrawAddress] = await deploy(
    'Withdraw',
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.actionWithdraw = actionWithdraw

  const [actionGenerate, actionGenerateAddress] = await deploy(
    'Generate',
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
  const [borrowInAAVEAction, actionBorrowFromAAVEAddress] = await deploy(
    'BorrowFromAAVE',
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
  await registry.addEntry(CONTRACT_LABELS.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(CONTRACT_LABELS.common.WETH, ADDRESSES.main.WETH)

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_LABELS.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_LABELS.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_LABELS.common.EXCHANGE, dummyExchangeAddress)
  await registry.addEntry(CONTRACT_LABELS.common.TAKE_A_FLASHLOAN, actionFlAddress)
  await registry.addEntry(CONTRACT_LABELS.common.SEND_TOKEN, sendTokenAddress)
  await registry.addEntry(CONTRACT_LABELS.common.PULL_TOKEN, pullTokenAddress)
  await registry.addEntry(CONTRACT_LABELS.common.SWAP_ON_ONE_INCH, swapAddress)
  await registry.addEntry(CONTRACT_LABELS.common.DUMMY_SWAP, dummySwapAddress)
  await registry.addEntry(
    CONTRACT_LABELS.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  //-- Add Maker Contract Entries
  await registry.addEntry(CONTRACT_LABELS.maker.MCD_VIEW, mcdViewAddress)
  await registry.addEntry(CONTRACT_LABELS.maker.FLASH_MINT_MODULE, ADDRESSES.main.fmm)
  await registry.addEntry(CONTRACT_LABELS.maker.OPEN_VAULT, actionOpenVaultAddress)
  await registry.addEntry(CONTRACT_LABELS.maker.DEPOSIT, actionDepositAddress)
  await registry.addEntry(CONTRACT_LABELS.maker.PAYBACK, actionPaybackAddress)
  await registry.addEntry(CONTRACT_LABELS.maker.WITHDRAW, actionWithdrawAddress)
  await registry.addEntry(CONTRACT_LABELS.maker.GENERATE, actionGenerateAddress)

  //-- Add AAVE Contract Entries
  await registry.addEntry(CONTRACT_LABELS.aave.BORROW_FROM_AAVE, actionBorrowFromAAVEAddress)
  await registry.addEntry(CONTRACT_LABELS.aave.DEPOSIT_IN_AAVE, actionDepositInAAVEAddress)
  await registry.addEntry(CONTRACT_LABELS.aave.WITHDRAW_FROM_AAVE, actionWithdrawFromAAVEAddress)
  await registry.addEntry(CONTRACT_LABELS.aave.AAVE_WETH_GATEWAY, ADDRESSES.main.AAVEWETHGateway)

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
