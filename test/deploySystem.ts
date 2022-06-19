import { Contract } from 'ethers'
import { ethers } from 'hardhat'

import DSProxyABI from '../abi/ds-proxy.json'
import { ADDRESSES } from '../helpers/addresses'
import { CONTRACT_NAMES, OPERATION_NAMES } from '../helpers/constants'
import { deploy } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { loadDummyExchangeFixtures } from '../helpers/swap/DummyExchange'
import { RuntimeConfig } from '../helpers/types/common'
import { logDebug, OperationsRegistry, ServiceRegistry } from '../helpers/utils'

export interface DeployedSystemInfo {
  common: {
    userProxyAddress: string
    dsProxy: Contract
    exchange: Contract
    takeFlashLoan: Contract
    sendToken: Contract
    pullToken: Contract
    swap: Contract
    dummySwap: Contract
    operationExecutor: Contract
    operationStorage: Contract
    serviceRegistry: Contract
  }
  aave: {
    deposit: Contract
    borrow: Contract
    withdraw: Contract
  }
  maker: {
    mcdView: Contract
    openVault: Contract
    deposit: Contract
    payback: Contract
    withdraw: Contract
    generate: Contract
  }
  gems: {
    wethTokenInstance: Contract
    daiTokenInstance: Contract
  }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deployedContracts: any = {
    common: {},
    maker: {},
    aave: {},
    gems: {},
  }

  // Setup User
  debug && console.log('1/ Setting up user proxy')
  const proxyAddress = await getOrCreateProxy(signer)
  deployedContracts.common.userProxyAddress = proxyAddress
  deployedContracts.common.dsProxy = new ethers.Contract(
    proxyAddress,
    DSProxyABI,
    provider,
  ).connect(signer)

  // Deploy System Contracts
  debug && console.log('2/ Deploying system contracts')
  const [serviceRegistry, serviceRegistryAddress] = await deploy('ServiceRegistry', [0], options)
  const registry = new ServiceRegistry(serviceRegistryAddress, signer)
  deployedContracts.common.serviceRegistry = serviceRegistry

  const [operationExecutor, operationExecutorAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.common.operationExecutor = operationExecutor

  const [operationStorage, operationStorageAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    [],
    options,
  )
  deployedContracts.common.operationStorage = operationStorage

  const [operationRegistry, operationsRegistryAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    [],
    options,
  )
  deployedContracts.common.operationRegistry = operationRegistry

  const [mcdView, mcdViewAddress] = await deploy(CONTRACT_NAMES.maker.MCD_VIEW, [], options)
  deployedContracts.maker.mcdView = mcdView

  const [dummyExchange, dummyExchangeAddress] = await deploy(
    CONTRACT_NAMES.test.DUMMY_EXCHANGE,
    [],
    options,
  )
  deployedContracts.common.exchange = dummyExchange

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)

  // Deploy Actions
  debug && console.log('3/ Deploying actions')
  //-- Common Actions
  const [dummySwap, dummySwapAddress] = await deploy(
    CONTRACT_NAMES.test.DUMMY_SWAP,
    [serviceRegistryAddress, ADDRESSES.main.WETH, dummyExchangeAddress],
    options,
  )
  deployedContracts.common.dummySwap = dummySwap

  const [swap, swapAddress] = await deploy(
    CONTRACT_NAMES.common.SWAP_ON_ONE_INCH,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.common.swap = swap

  const [sendToken, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [], options)
  deployedContracts.common.sendToken = sendToken

  const [pullToken, pullTokenAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [], options)
  deployedContracts.common.pullToken = pullToken

  const [actionFl, actionFlAddress] = await deploy(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.common.takeFlashLoan = actionFl

  //-- Maker Actions
  const [actionOpenVault, actionOpenVaultAddress] = await deploy(
    CONTRACT_NAMES.maker.OPEN_VAULT,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.maker.openVault = actionOpenVault

  const [actionDeposit, actionDepositAddress] = await deploy(
    CONTRACT_NAMES.maker.DEPOSIT,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.maker.deposit = actionDeposit

  const [actionPayback, actionPaybackAddress] = await deploy(
    CONTRACT_NAMES.maker.PAYBACK,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.maker.payback = actionPayback

  const [actionWithdraw, actionWithdrawAddress] = await deploy(
    CONTRACT_NAMES.maker.WITHDRAW,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.maker.withdraw = actionWithdraw

  const [actionGenerate, actionGenerateAddress] = await deploy(
    CONTRACT_NAMES.maker.GENERATE,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.maker.generate = actionGenerate

  //-- AAVE Actions
  const [depositInAAVEAction, actionDepositInAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.DEPOSIT,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.aave.deposit = depositInAAVEAction
  const [borrowInAAVEAction, actionAaveBorrowAddress] = await deploy(
    CONTRACT_NAMES.aave.BORROW,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.aave.borrow = borrowInAAVEAction
  const [withdrawInAAVEAction, actionWithdrawFromAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.WITHDRAW,
    [serviceRegistryAddress],
    options,
  )
  deployedContracts.aave.withdraw = withdrawInAAVEAction

  debug && console.log('4/ Adding contracts to registry')
  //-- Add Token Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)

  //-- Add Test Contract Entries
  const dummySwapHash = await registry.addEntry(CONTRACT_NAMES.test.DUMMY_SWAP, dummySwapAddress)

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
  await registry.addEntry(CONTRACT_NAMES.common.EXCHANGE, dummyExchangeAddress)
  await registry.addEntry(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, actionFlAddress)
  await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenAddress)
  const pullTokenHash = await registry.addEntry(CONTRACT_NAMES.common.PULL_TOKEN, pullTokenAddress)
  await registry.addEntry(CONTRACT_NAMES.common.SWAP_ON_ONE_INCH, swapAddress)
  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )

  //-- Add Maker Contract Entries
  await registry.addEntry(CONTRACT_NAMES.maker.MCD_VIEW, mcdViewAddress)
  await registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.maker.fmm)
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

  //-- Add AAVE Contract Entries
  await registry.addEntry(CONTRACT_NAMES.aave.BORROW, actionAaveBorrowAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.DEPOSIT, actionDepositInAAVEAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.WITHDRAW, actionWithdrawFromAAVEAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.WETH_GATEWAY, ADDRESSES.main.aave.WETHGateway)

  debug && console.log('5/ Adding operations to registry')
  const operationsRegistry: OperationsRegistry = new OperationsRegistry(
    operationsRegistryAddress,
    signer,
  )
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
    dummySwapHash,
    makerDepositHash,
  ])

  if (debug) {
    console.log('6/ Debugging...')
    logDebug([
      `Signer address: ${address}`,
      `Exchange address: ${deployedContracts.common.exchange.address}`,
      `User Proxy Address: ${deployedContracts.common.userProxyAddress}`,
      `DSProxy address: ${deployedContracts.common.dsProxy.address}`,
      `Registry address: ${deployedContracts.common.serviceRegistry.address}`,
      `Operation Executor address: ${deployedContracts.common.operationExecutor.address}`,
      `Operation Registry address: ${deployedContracts.common.operationRegistry.address}`,
      `Operator Storage address: ${deployedContracts.common.operationStorage.address}`,
      `Send Token address: ${deployedContracts.common.sendToken.address}`,
      `Pull Token address: ${deployedContracts.common.pullToken.address}`,
      `Flashloan Action address: ${deployedContracts.common.takeFlashLoan.address}`,

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

  return { system: deployedContracts as DeployedSystemInfo, registry }
}
