import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions'
import { ethers } from 'hardhat'

import DSProxyABI from '../abi/ds-proxy.json'
import { createDeploy } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { ServiceRegistry } from '../helpers/serviceRegistry'
import { loadDummyExchangeFixtures } from '../helpers/swap/DummyExchange'
import { RuntimeConfig, Unbox } from '../helpers/types/common'
import { logDebug } from '../helpers/utils'
import { OperationsRegistry } from '../helpers/wrappers/operationsRegistry'

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

  await uSwap.addFeeTier(20)

  const [swap, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
    address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])

  await swap.addFeeTier(20)

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

  const [sendToken, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [])
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
    ADDRESSES.main.DAI,
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

  const [paybackInAAVEAction, actionPaybackFromAAVEAddress] = await deploy(
    CONTRACT_NAMES.aave.PAYBACK,
    [serviceRegistryAddress],
  )

  debug && console.log('4/ Adding contracts to registry')
  //-- Add Token Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)

  // add flag to deploy fallbackSwap contract
  await registry.addEntry(CONTRACT_NAMES.common.SWAP, useFallbackSwap ? uSwapAddress : swapAddress)

  //-- Add Common Contract Entries
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
  await registry.addEntry(CONTRACT_NAMES.common.EXCHANGE, dummyExchangeAddress)
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
    ADDRESSES.main.oneInchAggregator,
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

  await registry.addEntry(CONTRACT_NAMES.maker.CDP_ALLOW, cdpAllowAddress)

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
  const aavePaybackHash = await registry.addEntry(
    CONTRACT_NAMES.aave.PAYBACK,
    actionPaybackFromAAVEAddress,
  )
  await registry.addEntry(CONTRACT_NAMES.aave.WETH_GATEWAY, ADDRESSES.main.aave.WETHGateway)
  await registry.addEntry(CONTRACT_NAMES.aave.LENDING_POOL, ADDRESSES.main.aave.MainnetLendingPool)

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
  await operationsRegistry.addOp(OPERATION_NAMES.aave.OPEN_POSITION, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.CLOSE_POSITION, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.INCREASE_POSITION, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.DEPOSIT_BORROW, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.BORROW, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.DEPOSIT, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.DECREASE_POSITION, [
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.PAYBACK_WITHDRAW, [
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
      userProxyAddress: proxyAddress,
      dsProxy,
      serviceRegistry,
      operationExecutor,
      operationStorage,
      operationRegistry,
      dummyAutomation,
      dummyCommmand,
      exchange: dummyExchange,
      swap: useFallbackSwap ? uSwap : swap,
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
      deposit: depositInAAVEAction,
      withdraw: withdrawInAAVEAction,
      borrow: borrowInAAVEAction,
      payback: paybackInAAVEAction,
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

      `AAVE|Borrow Action address: ${deployedContracts.aave.borrow.address}`,
      `AAVE|Deposit Action address: ${deployedContracts.aave.deposit.address}`,
      `AAVE|Withdraw Action address: ${deployedContracts.aave.withdraw.address}`,
    ])
  }

  return { system: deployedContracts, registry }
}

export type DeployedSystemInfo = Unbox<ReturnType<typeof deploySystem>>['system']