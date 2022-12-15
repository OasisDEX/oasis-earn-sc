import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions'
import { Contract } from 'ethers'

import DSProxyABI from '../abi/ds-proxy.json'
import { createDeploy, DeployFunction } from '../helpers/deploy'
import { getOrCreateProxy } from '../helpers/proxy'
import { ServiceRegistry } from '../helpers/serviceRegistry'
import { loadDummyExchangeFixtures } from '../helpers/swap/DummyExchange'
import { RuntimeConfig, Unbox } from '../helpers/types/common'
import { logDebug } from '../helpers/utils'
import { OperationsRegistry } from '../helpers/wrappers/operationsRegistry'

export async function deploySystem(config: RuntimeConfig, debug = false, useFallbackSwap = true) {
  const { provider, signer, address, ethers } = config
  console.log(`    \x1b[90mUsing fallback swap: ${useFallbackSwap}\x1b[0m`)
  const options = {
    debug,
    config,
  }

  debug && console.log('Deploying with address:', config.address)
  const deploy = await createDeploy(options)

  // Setup User
  const proxyAddress = await getOrCreateProxy(signer, ethers)
  const dsProxy = new ethers.Contract(proxyAddress, DSProxyABI, provider).connect(signer)

  const {
    serviceRegistry,
    operationExecutor,
    operationStorage,
    serviceRegistryAddress,
    operationsRegistryAddress,
    operationExecutorAddress,
    operationStorageAddress,
  } = await deployCoreContacts({ deploy, debug: options.debug })
  const registry = new ServiceRegistry(serviceRegistryAddress, signer, config.ethers)

  const {
    accountGuard,
    accountFactory,
    pullTokenAction,
    sendTokenAction,
    setApprovalAction,
    takeFlashloanAction,
    wrapEthAction,
    unwrapEthAction,
    returnFundsAction,
    swapAction,
    uSwap,
    swap,
    accountGuardAddress,
    positionCreatedAction,
    pullTokenActionAddress,
    sendTokenActionAddress,
    setApprovalActionAddress,
    takeFlashloanActionAddress,
    wrapActionAddress,
    unwrapActionAddress,
    returnFundsActionAddress,
    swapActionAddress,
    positionCreatedActionAddress,
    uSwapAddress,
    swapAddress,
  } = await deployCommonActions({ deploy, serviceRegistryAddress, config, debug })

  const { dpmProxyAddress } = await setupDPM({
    operationExecutorAddress,
    accountGuard,
    accountFactory,
  })

  const {
    depositInAAVEAction,
    borrowFromAAVEAction,
    withdrawFromAAVEAction,
    paybackToAAVEAction,
    depositInAAVEActionAddress,
    borrowFromAAVEActionAddress,
    withdrawFromAAVEActionAddress,
    paybackToAAVEActionAddress,
  } = await deployAaveActions({ deploy, serviceRegistryAddress, debug })

  const {
    mcdView,
    cdpAllow,
    depositInMakerAction,
    openVaultInMakerAction,
    generateFromMakerAction,
    withdrawFromMakerAction,
    paybackToMakerAction,
    mcdViewAddress,
    cdpAllowAddress,
    depositInMakerActionAddress,
    openVaultInMakerActionAddress,
    generateFromMakerActionAddress,
    withdrawFromMakerActionAddress,
    paybackToMakerActionAddress,
  } = await deployMakerActions({ deploy, serviceRegistryAddress, debug })

  const {
    dummyAction,
    dummyOptionalAction,
    dummyExchange,
    dummyAutomation,
    dummyCommmand,
    dummyCommandAddress,
    dummyActionAddress,
    dummyOptionalActionAddress,
    dummyAutomationAddress,
    dummyExchangeAddress,
  } = await deployDummyContracts({ deploy, serviceRegistryAddress, debug })

  await loadDummyExchangeFixtures(provider, signer, dummyExchange, debug)

  await addThirdPartyContractsToRegistry({ registry, debug })

  await addCoreContractsToRegistry({
    registry,
    addresses: {
      operationExecutorAddress,
      operationStorageAddress,
      operationsRegistryAddress,
    },
    debug,
  })

  const {
    pullTokenHash,
    sendTokenHash,
    setApprovalHash,
    takeAFlashloanHash,
    swapActionHash,
    wrapEthHash,
    unwrapEthHash,
    returnFundsHash,
    positionCreatedHash,
  } = await addCommonActionsToRegistry({
    registry,
    addresses: {
      pullTokenActionAddress,
      sendTokenActionAddress,
      setApprovalActionAddress,
      takeFlashloanActionAddress,
      swapActionAddress,
      swapAddress: useFallbackSwap ? uSwapAddress : swapAddress,
      wrapActionAddress,
      unwrapActionAddress,
      returnFundsActionAddress,
      positionCreatedActionAddress,
    },
    debug,
  })

  const { depositInAAVEHash, borromFromAAVEHash, withdrawFromAAVEHash, paybackToAAVEHash } =
    await addAAVEActionsToRegistry({
      registry,
      addresses: {
        depositInAAVEActionAddress,
        borrowFromAAVEActionAddress,
        withdrawFromAAVEActionAddress,
        paybackToAAVEActionAddress,
      },
      debug,
    })

  await addDummyContractsToRegistry({
    registry,
    addresses: {
      dummyExchangeAddress,
      dummyActionAddress,
      dummyOptionalActionAddress,
    },
    debug,
  })

  const {
    makerOpenVaultHash,
    makerDepositHash,
    makerGenerateHash,
    makerPaybackHash,
    makerWithdrawHash,
  } = await addMakerActionsToRegistry({
    registry,
    addresses: {
      openVaultInMakerActionAddress,
      depositInMakerActionAddress,
      paybackToMakerActionAddress,
      withdrawFromMakerActionAddress,
      generateFromMakerActionAddress,
      cdpAllowAddress,
    },
    debug,
  })

  const operationsRegistry: OperationsRegistry = new OperationsRegistry(
    operationsRegistryAddress,
    signer,
    config.ethers,
  )

  await addAAVEOperationsToRegistry({
    operationsRegistry,
    hashes: {
      pullTokenHash,
      takeAFlashloanHash,
      setApprovalHash,
      depositInAAVEHash,
      paybackToAAVEHash,
      borromFromAAVEHash,
      swapActionHash,
      withdrawFromAAVEHash,
      sendTokenHash,
      wrapEthHash,
      unwrapEthHash,
      returnFundsHash,
      positionCreatedHash,
    },
    debug,
  })
  await addMakerOperationsToRegistry({
    operationsRegistry,
    hashes: {
      sendTokenHash,
      pullTokenHash,
      swapActionHash,
      makerOpenVaultHash,
      makerDepositHash,
      makerGenerateHash,
      makerPaybackHash,
      makerWithdrawHash,
      takeAFlashloanHash,
    },
    debug,
  })

  const deployedSystem = {
    user: {
      address,
      dsProxy: dsProxy,
      dsProxyAddress: dsProxy.address,
      dpmProxyAddress,
    },
    core: {
      serviceRegistry,
      operationExecutor,
      operationStorage,
      operationsRegistry,
      dsProxy,
    },
    dummy: {
      dummyAction,
      dummyOptionalAction,
      dummyAutomation,
      dummyCommmand,
      exchange: dummyExchange,
    },
    common: {
      swap: useFallbackSwap ? uSwap : swap,
      swapAction,
      sendTokenAction,
      pullTokenAction,
      takeFlashloanAction,
      setApprovalAction,
      wrapEthAction,
      unwrapEthAction,
      returnFundsAction,
      positionCreatedAction,
      accountGuard,
      accountFactory,
    },
    maker: {
      mcdView,
      openVault: openVaultInMakerAction,
      deposit: depositInMakerAction,
      payback: paybackToMakerAction,
      withdraw: withdrawFromMakerAction,
      generate: generateFromMakerAction,
      cdpAllow,
    },
    aave: {
      deposit: depositInAAVEAction,
      withdraw: withdrawFromAAVEAction,
      borrow: borrowFromAAVEAction,
      payback: paybackToAAVEAction,
    },
  }

  if (debug) {
    console.log('==== ==== ====')
    console.log('DEBUGGING')

    logDebug(
      [
        `Signer address: ${deployedSystem.user.address}`,
        `User Proxy Address: ${deployedSystem.user.dsProxyAddress}`,
        `DSProxy address: ${deployedSystem.user.dsProxy.address}`,
        `DPM Proxy Address: ${deployedSystem.user.dpmProxyAddress}`,
      ],
      'User: ',
    )
    logDebug(
      [
        `Registry address: ${deployedSystem.core.serviceRegistry.address}`,
        `Operation Executor address: ${deployedSystem.core.operationExecutor.address}`,
        `Operation Storage address: ${deployedSystem.core.operationStorage.address}`,
        `Operations Registry address: ${deployedSystem.core.operationsRegistry.address}`,
      ],
      'Core Contracts: ',
    )

    logDebug(
      [
        `Send Token address: ${deployedSystem.common.sendTokenAction.address}`,
        `Pull Token address: ${deployedSystem.common.pullTokenAction.address}`,
        `Set Approval address: ${deployedSystem.common.setApprovalAction.address}`,
        `Wrap ETH address: ${deployedSystem.common.wrapEthAction.address}`,
        `Unwrap ETH address: ${deployedSystem.common.unwrapEthAction.address}`,
        `Flashloan Action address: ${deployedSystem.common.takeFlashloanAction.address}`,
        `Swap Action address: ${deployedSystem.common.swapAction.address}`,
        `Return Funds Action address: ${deployedSystem.common.returnFundsAction.address}`,
        `Position Created Action address: ${deployedSystem.common.positionCreatedAction.address}`,
        `Swap Action address: ${deployedSystem.common.swap.address}`,
        `Account Guard address: ${deployedSystem.common.accountGuard.address}`,
        `Account Factory address: ${deployedSystem.common.accountFactory.address}`,
      ],
      'Common Actions: ',
    )

    logDebug(
      [
        `Borrow Action address: ${deployedSystem.aave.borrow.address}`,
        `Deposit Action address: ${deployedSystem.aave.deposit.address}`,
        `Withdraw Action address: ${deployedSystem.aave.withdraw.address}`,
        `Payback Action address: ${deployedSystem.aave.payback.address}`,
      ],
      'AAVE Actions: ',
    )

    logDebug(
      [
        `MCDView address: ${deployedSystem.maker.mcdView.address}`,
        `CDP Allow address: ${deployedSystem.maker.cdpAllow.address}`,
        `OpenVault Action address: ${deployedSystem.maker.openVault.address}`,
        `Deposit Action address: ${deployedSystem.maker.deposit.address}`,
        `Payback Action address: ${deployedSystem.maker.payback.address}`,
        `Withdraw Action address: ${deployedSystem.maker.withdraw.address}`,
        `Generate Action address: ${deployedSystem.maker.generate.address}`,
      ],
      'Maker Actions: ',
    )

    logDebug(
      [
        `Dummy Action address: ${deployedSystem.dummy.dummyAction.address}`,
        `Dummy Optional Action address: ${deployedSystem.dummy.dummyOptionalAction.address}`,
        `Dummy Automation address: ${deployedSystem.dummy.dummyAutomation.address}`,
        `Dummy Command address: ${deployedSystem.dummy.dummyCommmand.address}`,
        `Dummy Exchange address: ${deployedSystem.dummy.exchange.address}`,
      ],
      'Dummy Contracts: ',
    )
  }

  return { system: deployedSystem, registry }
}

export type DeployedSystemInfo = Unbox<ReturnType<typeof deploySystem>>['system']

async function deployCoreContacts(args: { deploy: DeployFunction; debug: boolean }) {
  const { deploy, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING CORE CONTRACTS')
  }
  const [serviceRegistry, serviceRegistryAddress] = await deploy(
    CONTRACT_NAMES.common.SERVICE_REGISTRY,
    [0],
  )
  const [operationsRegistry, operationsRegistryAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    [],
  )
  const [operationExecutor, operationExecutorAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    [serviceRegistryAddress],
  )
  const [operationStorage, operationStorageAddress] = await deploy(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    [serviceRegistryAddress, operationExecutorAddress],
  )

  return {
    serviceRegistry,
    operationsRegistry,
    operationExecutor,
    operationStorage,
    serviceRegistryAddress,
    operationsRegistryAddress,
    operationExecutorAddress,
    operationStorageAddress,
  }
}

async function deployCommonActions(args: {
  deploy: DeployFunction
  serviceRegistryAddress: string
  config: RuntimeConfig
  debug: boolean
}) {
  const { deploy, serviceRegistryAddress, config, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING COMMON CONTRACTS')
  }
  const [pullTokenAction, pullTokenActionAddress] = await deploy(
    CONTRACT_NAMES.common.PULL_TOKEN,
    [],
  )
  const [sendTokenAction, sendTokenActionAddress] = await deploy(
    CONTRACT_NAMES.common.SEND_TOKEN,
    [],
  )
  const [setApprovalAction, setApprovalActionAddress] = await deploy(
    CONTRACT_NAMES.common.SET_APPROVAL,
    [serviceRegistryAddress],
  )
  const [takeFlashloanAction, takeFlashloanActionAddress] = await deploy(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    [serviceRegistryAddress, ADDRESSES.main.DAI],
  )
  const [wrapEthAction, wrapActionAddress] = await deploy(CONTRACT_NAMES.common.WRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [unwrapEthAction, unwrapActionAddress] = await deploy(CONTRACT_NAMES.common.UNWRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [positionCreatedAction, positionCreatedActionAddress] = await deploy(
    CONTRACT_NAMES.common.POSITION_CREATED,
    [],
  )
  const [returnFundsAction, returnFundsActionAddress] = await deploy(
    CONTRACT_NAMES.common.RETURN_FUNDS,
    [],
  )
  const [uSwap, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
    config.address,
    ADDRESSES.main.feeRecipient,
    0, // TODO add different fee tiers
    serviceRegistryAddress,
  ])
  await uSwap.setPool(
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    10000,
  )
  await uSwap.addFeeTier(20)
  const [swap, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
    config.address,
    ADDRESSES.main.feeRecipient,
    0,
    serviceRegistryAddress,
  ])
  await swap.addFeeTier(20)
  const [swapAction, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])
  const [accountGuard, accountGuardAddress] = await deploy('AccountGuard', [])
  const [accountFactory] = await deploy('AccountFactory', [accountGuardAddress])

  return {
    accountGuard,
    accountFactory,
    pullTokenAction,
    sendTokenAction,
    setApprovalAction,
    takeFlashloanAction,
    wrapEthAction,
    unwrapEthAction,
    returnFundsAction,
    positionCreatedAction,
    swapAction,
    uSwap,
    swap,
    accountGuardAddress,
    pullTokenActionAddress,
    sendTokenActionAddress,
    setApprovalActionAddress,
    takeFlashloanActionAddress,
    wrapActionAddress,
    unwrapActionAddress,
    returnFundsActionAddress,
    positionCreatedActionAddress,
    swapActionAddress,
    uSwapAddress,
    swapAddress,
  }
}

async function deployAaveActions(args: {
  deploy: DeployFunction
  serviceRegistryAddress: string
  debug: boolean
}) {
  const { deploy, serviceRegistryAddress, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING AAVE CONTRACTS')
  }
  const [depositInAAVEAction, depositInAAVEActionAddress] = await deploy(
    CONTRACT_NAMES.aave.DEPOSIT,
    [serviceRegistryAddress],
  )
  const [borrowFromAAVEAction, borrowFromAAVEActionAddress] = await deploy(
    CONTRACT_NAMES.aave.BORROW,
    [serviceRegistryAddress],
  )
  const [withdrawFromAAVEAction, withdrawFromAAVEActionAddress] = await deploy(
    CONTRACT_NAMES.aave.WITHDRAW,
    [serviceRegistryAddress],
  )
  const [paybackToAAVEAction, paybackToAAVEActionAddress] = await deploy(
    CONTRACT_NAMES.aave.PAYBACK,
    [serviceRegistryAddress],
  )

  return {
    depositInAAVEAction,
    borrowFromAAVEAction,
    withdrawFromAAVEAction,
    paybackToAAVEAction,
    depositInAAVEActionAddress,
    borrowFromAAVEActionAddress,
    withdrawFromAAVEActionAddress,
    paybackToAAVEActionAddress,
  }
}

async function deployMakerActions(args: {
  deploy: DeployFunction
  serviceRegistryAddress: string
  debug: boolean
}) {
  const { deploy, serviceRegistryAddress, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING MAKER CONTRACTS')
  }

  const [mcdView, mcdViewAddress] = await deploy(CONTRACT_NAMES.maker.MCD_VIEW, [])
  const [cdpAllow, cdpAllowAddress] = await deploy(CONTRACT_NAMES.maker.CDP_ALLOW, [
    serviceRegistryAddress,
  ])
  const [openVaultInMakerAction, openVaultInMakerActionAddress] = await deploy(
    CONTRACT_NAMES.maker.OPEN_VAULT,
    [serviceRegistryAddress],
  )
  const [depositInMakerAction, depositInMakerActionAddress] = await deploy(
    CONTRACT_NAMES.maker.DEPOSIT,
    [serviceRegistryAddress],
  )
  const [paybackToMakerAction, paybackToMakerActionAddress] = await deploy(
    CONTRACT_NAMES.maker.PAYBACK,
    [serviceRegistryAddress],
  )
  const [withdrawFromMakerAction, withdrawFromMakerActionAddress] = await deploy(
    CONTRACT_NAMES.maker.WITHDRAW,
    [serviceRegistryAddress],
  )
  const [generateFromMakerAction, generateFromMakerActionAddress] = await deploy(
    CONTRACT_NAMES.maker.GENERATE,
    [serviceRegistryAddress],
  )

  return {
    mcdView,
    cdpAllow,
    openVaultInMakerAction,
    depositInMakerAction,
    paybackToMakerAction,
    withdrawFromMakerAction,
    generateFromMakerAction,
    mcdViewAddress,
    cdpAllowAddress,
    openVaultInMakerActionAddress,
    depositInMakerActionAddress,
    paybackToMakerActionAddress,
    withdrawFromMakerActionAddress,
    generateFromMakerActionAddress,
  }
}

async function deployDummyContracts(args: {
  deploy: DeployFunction
  serviceRegistryAddress: string
  debug: boolean
}) {
  const { deploy, serviceRegistryAddress, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING DUMMY CONTRACTS')
  }
  const [dummyExchange, dummyExchangeAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_EXCHANGE, [])
  const [dummyAutomation, dummyAutomationAddress] = await deploy('DummyAutomation', [
    serviceRegistryAddress,
  ])
  const [dummyCommmand, dummyCommandAddress] = await deploy('DummyCommand', [
    serviceRegistryAddress,
  ])
  const [dummyAction, dummyActionAddress] = await deploy(CONTRACT_NAMES.test.DUMMY_ACTION, [
    serviceRegistryAddress,
  ])
  const [dummyOptionalAction, dummyOptionalActionAddress] = await deploy(
    CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION,
    [serviceRegistryAddress],
  )

  return {
    dummyExchange,
    dummyAutomation,
    dummyCommmand,
    dummyAction,
    dummyOptionalAction,
    dummyExchangeAddress,
    dummyAutomationAddress,
    dummyCommandAddress,
    dummyActionAddress,
    dummyOptionalActionAddress,
  }
}

async function addThirdPartyContractsToRegistry(args: {
  registry: ServiceRegistry
  debug?: boolean
}) {
  const { registry, debug } = args
  const uniswapRouterHash = await registry.addEntry(
    CONTRACT_NAMES.common.UNISWAP_ROUTER,
    ADDRESSES.main.uniswapRouterV3,
  )
  const flashmintModuleHash = await registry.addEntry(
    CONTRACT_NAMES.maker.FLASH_MINT_MODULE,
    ADDRESSES.main.maker.fmm,
  )
  const wethHash = await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)
  const daiHash = await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  const oneInchAggregatorHash = await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )
  const aaveLendingPoolHash = await registry.addEntry(
    CONTRACT_NAMES.aave.LENDING_POOL,
    ADDRESSES.main.aave.MainnetLendingPool,
  )
  const wethGatewayhash = await registry.addEntry(
    CONTRACT_NAMES.aave.WETH_GATEWAY,
    ADDRESSES.main.aave.WETHGateway,
  )
  const cdpManagerHash = await registry.addEntry(
    CONTRACT_NAMES.maker.MCD_MANAGER,
    ADDRESSES.main.maker.cdpManager,
  )
  const makerJugHash = await registry.addEntry(
    CONTRACT_NAMES.maker.MCD_JUG,
    ADDRESSES.main.maker.jug,
  )
  const joinDaiHash = await registry.addEntry(
    CONTRACT_NAMES.maker.MCD_JOIN_DAI,
    ADDRESSES.main.maker.joinDAI,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING THIRD PARTY CONTRACTS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.UNISWAP_ROUTER} is ${uniswapRouterHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.FLASH_MINT_MODULE} is ${flashmintModuleHash}`,
    )
    console.log(`Service Registry Hash for contract: ${CONTRACT_NAMES.common.WETH} is ${wethHash}`)
    console.log(`Service Registry Hash for contract: ${CONTRACT_NAMES.common.DAI} is ${daiHash}`)
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR} is ${oneInchAggregatorHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.LENDING_POOL} is ${aaveLendingPoolHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.WETH_GATEWAY} is ${wethGatewayhash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.MCD_MANAGER} is ${cdpManagerHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.MCD_JUG} is ${makerJugHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.MCD_JOIN_DAI} is ${joinDaiHash}`,
    )
  }
}

async function addCoreContractsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    operationExecutorAddress: string
    operationStorageAddress: string
    operationsRegistryAddress: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const operationExecutorHash = await registry.addEntry(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    addresses.operationExecutorAddress,
  )
  const operationStorageHash = await registry.addEntry(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    addresses.operationStorageAddress,
  )
  const operationsRegistryHash = await registry.addEntry(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    addresses.operationsRegistryAddress,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING CORE CONTRACTS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.OPERATION_EXECUTOR} is ${operationExecutorHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.OPERATION_STORAGE} is ${operationStorageHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.OPERATIONS_REGISTRY} is ${operationsRegistryHash}`,
    )
  }
}

async function addCommonActionsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    pullTokenActionAddress: string
    sendTokenActionAddress: string
    setApprovalActionAddress: string
    takeFlashloanActionAddress: string
    swapActionAddress: string
    swapAddress: string
    wrapActionAddress: string
    unwrapActionAddress: string
    returnFundsActionAddress: string
    positionCreatedActionAddress: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const pullTokenHash = await registry.addEntry(
    CONTRACT_NAMES.common.PULL_TOKEN,
    addresses.pullTokenActionAddress,
  )
  const sendTokenHash = await registry.addEntry(
    CONTRACT_NAMES.common.SEND_TOKEN,
    addresses.sendTokenActionAddress,
  )
  const setApprovalHash = await registry.addEntry(
    CONTRACT_NAMES.common.SET_APPROVAL,
    addresses.setApprovalActionAddress,
  )
  const takeAFlashloanHash = await registry.addEntry(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    addresses.takeFlashloanActionAddress,
  )
  const swapHash = await registry.addEntry(CONTRACT_NAMES.common.SWAP, addresses.swapAddress)
  const swapActionHash = await registry.addEntry(
    CONTRACT_NAMES.common.SWAP_ACTION,
    addresses.swapActionAddress,
  )
  const wrapEthHash = await registry.addEntry(
    CONTRACT_NAMES.common.WRAP_ETH,
    addresses.wrapActionAddress,
  )
  const unwrapEthHash = await registry.addEntry(
    CONTRACT_NAMES.common.UNWRAP_ETH,
    addresses.unwrapActionAddress,
  )
  const returnFundsHash = await registry.addEntry(
    CONTRACT_NAMES.common.RETURN_FUNDS,
    addresses.returnFundsActionAddress,
  )

  const positionCreatedHash = await registry.addEntry(
    CONTRACT_NAMES.common.POSITION_CREATED,
    addresses.positionCreatedActionAddress,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING COMMON ACTIONS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.PULL_TOKEN} is ${pullTokenHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.SEND_TOKEN} is ${sendTokenHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.SET_APPROVAL} is ${setApprovalHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.TAKE_A_FLASHLOAN} is ${takeAFlashloanHash}`,
    )
    console.log(`Service Registry Hash for contract: ${CONTRACT_NAMES.common.SWAP} is ${swapHash}`)
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.SWAP_ACTION} is ${swapActionHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.WRAP_ETH} is ${wrapEthHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.UNWRAP_ETH} is ${unwrapEthHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.RETURN_FUNDS} is ${returnFundsHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.POSITION_CREATED} is ${positionCreatedHash}`,
    )
  }

  return {
    pullTokenHash,
    sendTokenHash,
    setApprovalHash,
    takeAFlashloanHash,
    swapActionHash,
    wrapEthHash,
    unwrapEthHash,
    returnFundsHash,
    positionCreatedHash,
  }
}

async function addAAVEActionsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    depositInAAVEActionAddress: string
    borrowFromAAVEActionAddress: string
    withdrawFromAAVEActionAddress: string
    paybackToAAVEActionAddress: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const depositInAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.DEPOSIT,
    addresses.depositInAAVEActionAddress,
  )
  const borromFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.BORROW,
    addresses.borrowFromAAVEActionAddress,
  )
  const withdrawFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.WITHDRAW,
    addresses.withdrawFromAAVEActionAddress,
  )
  const paybackToAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.PAYBACK,
    addresses.paybackToAAVEActionAddress,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING AAVE ACTIONS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.DEPOSIT} is ${depositInAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.BORROW} is ${borromFromAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.WITHDRAW} is ${withdrawFromAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.PAYBACK} is ${paybackToAAVEHash}`,
    )
  }

  return {
    depositInAAVEHash,
    borromFromAAVEHash,
    withdrawFromAAVEHash,
    paybackToAAVEHash,
  }
}

async function addDummyContractsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    dummyExchangeAddress: string
    dummyActionAddress: string
    dummyOptionalActionAddress: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const dummyExchangeHash = await registry.addEntry(
    CONTRACT_NAMES.common.EXCHANGE,
    addresses.dummyExchangeAddress,
  )
  const dummyActionHash = await registry.addEntry(
    CONTRACT_NAMES.test.DUMMY_ACTION,
    addresses.dummyActionAddress,
  )
  const dummyOptionalActionHash = await registry.addEntry(
    CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION,
    addresses.dummyOptionalActionAddress,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING DUMMY CONTRACTS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.EXCHANGE} is ${dummyExchangeHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.test.DUMMY_ACTION} is ${dummyActionHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.test.DUMMY_OPTIONAL_ACTION} is ${dummyOptionalActionHash}`,
    )
  }

  return {
    dummyExchangeHash,
    dummyActionHash,
    dummyOptionalActionHash,
  }
}

async function addMakerActionsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    openVaultInMakerActionAddress: string
    depositInMakerActionAddress: string
    paybackToMakerActionAddress: string
    withdrawFromMakerActionAddress: string
    generateFromMakerActionAddress: string
    cdpAllowAddress: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const makerOpenVaultHash = await registry.addEntry(
    CONTRACT_NAMES.maker.OPEN_VAULT,
    addresses.openVaultInMakerActionAddress,
  )
  const makerDepositHash = await registry.addEntry(
    CONTRACT_NAMES.maker.DEPOSIT,
    addresses.depositInMakerActionAddress,
  )
  const makerPaybackHash = await registry.addEntry(
    CONTRACT_NAMES.maker.PAYBACK,
    addresses.paybackToMakerActionAddress,
  )
  const makerWithdrawHash = await registry.addEntry(
    CONTRACT_NAMES.maker.WITHDRAW,
    addresses.withdrawFromMakerActionAddress,
  )
  const makerGenerateHash = await registry.addEntry(
    CONTRACT_NAMES.maker.GENERATE,
    addresses.generateFromMakerActionAddress,
  )
  const cdpAllowHash = await registry.addEntry(
    CONTRACT_NAMES.maker.CDP_ALLOW,
    addresses.cdpAllowAddress,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING MAKER ACTIONS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.OPEN_VAULT} is ${makerOpenVaultHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.DEPOSIT} is ${makerDepositHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.PAYBACK} is ${makerPaybackHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.WITHDRAW} is ${makerWithdrawHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.GENERATE} is ${makerGenerateHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.maker.CDP_ALLOW} is ${cdpAllowHash}`,
    )
  }

  return {
    makerOpenVaultHash,
    makerDepositHash,
    makerPaybackHash,
    makerWithdrawHash,
    makerGenerateHash,
    cdpAllowHash,
  }
}

async function addAAVEOperationsToRegistry(args: {
  operationsRegistry: OperationsRegistry
  hashes: {
    pullTokenHash: string
    takeAFlashloanHash: string
    setApprovalHash: string
    depositInAAVEHash: string
    borromFromAAVEHash: string
    paybackToAAVEHash: string
    swapActionHash: string
    withdrawFromAAVEHash: string
    sendTokenHash: string
    wrapEthHash: string
    unwrapEthHash: string
    returnFundsHash: string
    positionCreatedHash: string
  }
  debug: boolean
}) {
  const { operationsRegistry, hashes, debug } = args
  const {
    pullTokenHash,
    takeAFlashloanHash,
    setApprovalHash,
    depositInAAVEHash,
    borromFromAAVEHash,
    paybackToAAVEHash,
    swapActionHash,
    withdrawFromAAVEHash,
    wrapEthHash,
    unwrapEthHash,
    returnFundsHash,
    positionCreatedHash,
  } = hashes

  const openPositionActions = [
    {
      hash: takeAFlashloanHash,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: borromFromAAVEHash,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
      optional: false,
    },
    { hash: positionCreatedHash, optional: false },
  ]
  await operationsRegistry.addOp(OPERATION_NAMES.aave.OPEN_POSITION, openPositionActions)

  const closePositionActions = [
    {
      hash: takeAFlashloanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
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
      hash: paybackToAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
      optional: false,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsHash,
      optional: false,
    },
    {
      hash: returnFundsHash,
      optional: false,
    },
  ]
  await operationsRegistry.addOp(OPERATION_NAMES.aave.CLOSE_POSITION, closePositionActions)

  const increasePositionMultipleActions = [
    {
      hash: takeAFlashloanHash,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: borromFromAAVEHash,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
      optional: false,
    },
  ]
  await operationsRegistry.addOp(
    OPERATION_NAMES.aave.INCREASE_POSITION,
    increasePositionMultipleActions,
  )

  const decreasePositionMultipleActions = [
    {
      hash: takeAFlashloanHash,
      optional: false,
    },
    {
      hash: setApprovalHash,
      optional: false,
    },
    {
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
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
      hash: paybackToAAVEHash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEHash,
      optional: false,
    },
  ]
  await operationsRegistry.addOp(
    OPERATION_NAMES.aave.DECREASE_POSITION,
    decreasePositionMultipleActions,
  )

  await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING OPERATIONS TO REGISTRY')
    console.log(
      `Operations Registry Entry for Open AAVE Position: ${JSON.stringify(openPositionActions)}`,
    )
    console.log(
      `Operations Registry Entry for Close AAVE Position: ${JSON.stringify(closePositionActions)}`,
    )
    console.log(
      `Operations Registry Entry for Increase Multiple AAVE Position: ${JSON.stringify(
        increasePositionMultipleActions,
      )}`,
    )
    console.log(
      `Operations Registry Entry for Decrease Multiple AAVE Position: ${JSON.stringify(
        decreasePositionMultipleActions,
      )}`,
    )
  }
}

async function addMakerOperationsToRegistry(args: {
  operationsRegistry: OperationsRegistry
  hashes: {
    sendTokenHash: string
    pullTokenHash: string
    swapActionHash: string
    makerOpenVaultHash: string
    makerDepositHash: string
    makerGenerateHash: string
    makerPaybackHash: string
    makerWithdrawHash: string
    takeAFlashloanHash: string
  }
  debug: boolean
}) {
  const { operationsRegistry, hashes, debug } = args
  const {
    sendTokenHash,
    pullTokenHash,
    swapActionHash,
    makerOpenVaultHash,
    makerDepositHash,
    makerGenerateHash,
    makerPaybackHash,
    makerWithdrawHash,
    takeAFlashloanHash,
  } = hashes

  await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

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
      hash: takeAFlashloanHash,
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
        hash: takeAFlashloanHash,
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

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING MAKER OPERATIONS TO REGISTRY')
  }
}

async function setupDPM(args: {
  accountGuard: Contract
  accountFactory: Contract
  operationExecutorAddress: string
}) {
  console.log('==== ==== ====')
  console.log('SETTING UP DPM')
  const tx = await args.accountFactory['createAccount()']()
  const receipt = await tx.wait()

  // eslint-disable-next-line
  const dpmProxyAddress = receipt.events![1].args!.proxy;

  await args.accountGuard.setWhitelist(args.operationExecutorAddress, true)

  return { dpmProxyAddress }
}
