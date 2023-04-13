import { ADDRESSES } from '@oasisdex/addresses'
import { OPERATION_NAMES } from '@oasisdex/dma-common/constants'
import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants/contract-names'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { createDeploy, DeployFunction } from '@oasisdex/dma-common/utils/deploy'
import init from '@oasisdex/dma-common/utils/init'
import { OperationsRegistry } from '@oasisdex/dma-common/utils/wrappers/operations-registry'
import { ServiceRegistry } from '@oasisdex/dma-common/utils/wrappers/service-registry'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { task } from 'hardhat/config'

task(
  'deploy',
  'Deploy specific system. Use a "key" to select a dma-contracts set from predefined ones.',
)
  .addFlag('debug', 'When used, deployed contract address is displayed')
  .addFlag('usefallbackswap', 'Use fallback (or dummy) swap contract')
  .setAction(async (taskArgs, hre) => {
    const config = await init(hre)
    const options = {
      debug: taskArgs.debug,
      config,
    }

    const deploy = await createDeploy(options, hre)

    const {
      serviceRegistryAddress,
      operationsRegistryAddress,
      operationExecutorAddress,
      operationStorageAddress,
      accountFactoryAddress,
    } = await deployCoreContacts({ deploy, debug: taskArgs.debug })

    const {
      pullTokenActionAddress,
      sendTokenAddress,
      setApprovalAddress,
      flActionAddress,
      wrapActionAddress,
      unwrapActionAddress,
      returnFundsActionAddress,
      uSwapAddress,
      swapAddress,
      swapActionAddress,
      positionCreatedAddress,
    } = await deployCommonActions({ deploy, serviceRegistryAddress, config, debug: taskArgs.debug })

    const {
      depositInAAVEAddress,
      borrowFromAAVEAddress,
      withdrawFromAAVEAddress,
      actionPaybackFromAAVEAddress,
      actionDepositInAAVEV3Address,
      actionAaveV3BorrowAddress,
      actionWithdrawFromAAVEV3Address,
      actionPaybackFromAAVEV3Address,
      actionSetEModeInAAVEV3Address,
    } = await deployAaveActions({ deploy, serviceRegistryAddress, debug: taskArgs.debug })

    const registry: ServiceRegistry = new ServiceRegistry(serviceRegistryAddress, config.signer)
    await addThirdPartyContractsToRegistry({ registry, debug: taskArgs.debug })

    await addCoreContractsToRegistry({
      registry,
      addresses: {
        operationExecutorAddress,
        operationStorageAddress,
        operationsRegistryAddress,
        accountFactoryAddress,
      },
      debug: taskArgs.debug,
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
        sendTokenAddress,
        setApprovalAddress,
        flActionAddress,
        swapActionAddress,
        swapAddress: taskArgs.usefallbackswap ? uSwapAddress : swapAddress,
        wrapActionAddress,
        unwrapActionAddress,
        returnFundsActionAddress,
        positionCreatedAddress,
      },
      debug: taskArgs.debug,
    })

    const {
      depositInAAVEHash,
      borromFromAAVEHash,
      withdrawFromAAVEHash,
      paybackToAAVEHash,
      depositInAAVEV3Hash,
      borrowFromAAVEV3Hash,
      withdrawFromAAVEV3Hash,
      paybackFromAAVEV3Hash,
      setEModeInAAVEV3Hash,
    } = await addAAVEActionsToRegistry({
      registry,
      addresses: {
        depositInAAVEAddress,
        borrowFromAAVEAddress,
        withdrawFromAAVEAddress,
        actionPaybackFromAAVEAddress,
        actionDepositInAAVEV3Address,
        actionAaveV3BorrowAddress,
        actionWithdrawFromAAVEV3Address,
        actionPaybackFromAAVEV3Address,
        actionSetEModeInAAVEV3Address,
      },
      debug: taskArgs.debug,
    })

    await addMakerActionsToRegistry()

    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      operationsRegistryAddress,
      config.signer,
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
        depositInAAVEV3Hash,
        borrowFromAAVEV3Hash,
        withdrawFromAAVEV3Hash,
        paybackFromAAVEV3Hash,
        setEModeInAAVEV3Hash,
        swapActionHash,
        withdrawFromAAVEHash,
        sendTokenHash,
        wrapEthHash,
        unwrapEthHash,
        returnFundsHash,
        positionCreatedHash,
      },
      debug: taskArgs.debug,
    })
  })

async function deployCoreContacts(args: { deploy: DeployFunction; debug: boolean }) {
  const { deploy, debug } = args
  if (debug) {
    console.log('==== ==== ====')
    console.log('DEPLOYING CORE CONTRACTS')
  }
  const [, serviceRegistryAddress] = await deploy(CONTRACT_NAMES.common.SERVICE_REGISTRY, [0])
  const [, operationsRegistryAddress] = await deploy(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, [])
  const [, operationExecutorAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_EXECUTOR, [
    serviceRegistryAddress,
  ])
  const [, operationStorageAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_STORAGE, [
    serviceRegistryAddress,
    operationExecutorAddress,
  ])

  // DPM
  const [accountGuard, accountGuardAddress] = await deploy('AccountGuard', [])
  const [accountFactory, accountFactoryAddress] = await deploy('AccountFactory', [
    accountGuardAddress,
  ])

  const tx = await accountFactory['createAccount()']()
  await tx.wait()
  console.log('account guard', accountGuard.address)
  console.log('setting whitelist on ', operationExecutorAddress)
  await accountGuard.setWhitelist(operationExecutorAddress, true)

  return {
    serviceRegistryAddress,
    operationsRegistryAddress,
    operationExecutorAddress,
    operationStorageAddress,
    accountFactoryAddress,
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
  const [, pullTokenActionAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])
  const [, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [
    serviceRegistryAddress,
  ])
  const [, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [
    serviceRegistryAddress,
  ])
  const [, flActionAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
    serviceRegistryAddress,
    ADDRESSES[Network.MAINNET].common.DAI,
  ])

  const [, wrapActionAddress] = await deploy(CONTRACT_NAMES.common.WRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [, unwrapActionAddress] = await deploy(CONTRACT_NAMES.common.UNWRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [, positionCreatedAddress] = await deploy(CONTRACT_NAMES.common.POSITION_CREATED, [])
  const [, returnFundsActionAddress] = await deploy(CONTRACT_NAMES.common.RETURN_FUNDS, [])

  const [uSwap, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
    config.address,
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
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
    ADDRESSES[Network.MAINNET].common.FeeRecipient,
    0,
    serviceRegistryAddress,
  ])

  await swap.addFeeTier(20)

  const [, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])

  return {
    pullTokenActionAddress,
    sendTokenAddress,
    setApprovalAddress,
    flActionAddress,
    wrapActionAddress,
    unwrapActionAddress,
    returnFundsActionAddress,
    positionCreatedAddress,
    uSwapAddress,
    swapAddress,
    swapActionAddress,
  }
}

// async function deployAaveActions(
//   deploy: DeployFunction,
//   serviceRegistryAddress: string,
//   config: RuntimeConfig,
// ) {
//   const [, depositInAAVEAddress] = await deploy(CONTRACT_NAMES.aave.DEPOSIT, [
//     serviceRegistryAddress,
//   ])
//   const [, borrowFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.BORROW, [
//     serviceRegistryAddress,
//   ])
//   const [, withdrawFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.WITHDRAW, [
//     serviceRegistryAddress,
//   ])
//   const [, actionPaybackFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.PAYBACK, [
//     serviceRegistryAddress,
//   ])
//
//   const [uSwap, uSwapAddress] = await deploy(CONTRACT_NAMES.test.SWAP, [
//     config.address,
//     ADDRESSES[Network.MAINNET].feeRecipient,
//     0, // TODO add different fee tiers
//     serviceRegistryAddress,
//   ])
//   await uSwap.setPool(
//     '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
//     '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//     10000,
//   )
//   await uSwap.addFeeTier(20)
//
//   const [swap, swapAddress] = await deploy(CONTRACT_NAMES.dma-common.SWAP, [
//     config.address,
//     ADDRESSES[Network.MAINNET].feeRecipient,
//     0,
//     serviceRegistryAddress,
//   ])
//
//   await swap.addFeeTier(20)
//
//   const [, swapActionAddress] = await deploy(CONTRACT_NAMES.dma-common.SWAP_ACTION, [
//     serviceRegistryAddress,
//   ])
//
//   return {
//     pullTokenActionAddress,
//     sendTokenAddress,
//     setApprovalAddress,
//     flActionAddress,
//     wrapActionAddress,
//     unwrapActionAddress,
//     returnFundsActionAddress,
//     uSwapAddress,
//     swapAddress,
//     swapActionAddress,
//   }
// }

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
  const [, depositInAAVEAddress] = await deploy(CONTRACT_NAMES.aave.v2.DEPOSIT, [
    serviceRegistryAddress,
  ])
  const [, borrowFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.v2.BORROW, [
    serviceRegistryAddress,
  ])
  const [, withdrawFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.v2.WITHDRAW, [
    serviceRegistryAddress,
  ])
  const [, actionPaybackFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.v2.PAYBACK, [
    serviceRegistryAddress,
  ])

  //-- AAVE V3 Actions
  const [, actionDepositInAAVEV3Address] = await deploy(CONTRACT_NAMES.aave.v3.DEPOSIT, [
    serviceRegistryAddress,
  ])

  const [, actionAaveV3BorrowAddress] = await deploy(CONTRACT_NAMES.aave.v3.BORROW, [
    serviceRegistryAddress,
  ])

  const [, actionWithdrawFromAAVEV3Address] = await deploy(CONTRACT_NAMES.aave.v3.WITHDRAW, [
    serviceRegistryAddress,
  ])

  const [, actionPaybackFromAAVEV3Address] = await deploy(CONTRACT_NAMES.aave.v3.PAYBACK, [
    serviceRegistryAddress,
  ])

  const [, actionSetEModeInAAVEV3Address] = await deploy(CONTRACT_NAMES.aave.v3.SET_EMODE, [
    serviceRegistryAddress,
  ])

  return {
    depositInAAVEAddress,
    borrowFromAAVEAddress,
    withdrawFromAAVEAddress,
    actionPaybackFromAAVEAddress,
    actionDepositInAAVEV3Address,
    actionAaveV3BorrowAddress,
    actionWithdrawFromAAVEV3Address,
    actionPaybackFromAAVEV3Address,
    actionSetEModeInAAVEV3Address,
  }
}

async function addThirdPartyContractsToRegistry(args: {
  registry: ServiceRegistry
  debug?: boolean
}) {
  const { registry, debug } = args
  const uniswapRouterHash = await registry.addEntry(
    CONTRACT_NAMES.common.UNISWAP_ROUTER,
    ADDRESSES[Network.MAINNET].common.UniswapRouterV3,
  )
  const flashmintModuleHash = await registry.addEntry(
    CONTRACT_NAMES.maker.FLASH_MINT_MODULE,
    ADDRESSES[Network.MAINNET].maker.FlashMintModule,
  )
  const wethHash = await registry.addEntry(
    CONTRACT_NAMES.common.WETH,
    ADDRESSES[Network.MAINNET].common.WETH,
  )
  const daiHash = await registry.addEntry(
    CONTRACT_NAMES.common.DAI,
    ADDRESSES[Network.MAINNET].common.DAI,
  )
  const oneInchAggregatorHash = await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES[Network.MAINNET].common.OneInchAggregator,
  )
  const aaveLendingPoolHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.LENDING_POOL,
    ADDRESSES[Network.MAINNET].aave.v2.LendingPool,
  )
  const wethGatewayhash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.WETH_GATEWAY,
    ADDRESSES[Network.MAINNET].aave.v2.WETHGateway,
  )
  const aaveV3PoolHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.AAVE_POOL,
    ADDRESSES[Network.MAINNET].aave.v3.Pool,
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
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.LENDING_POOL} is ${aaveLendingPoolHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.WETH_GATEWAY} is ${wethGatewayhash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.AAVE_POOL} is ${aaveV3PoolHash}`,
    )
  }
}

async function addCoreContractsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    operationExecutorAddress: string
    operationStorageAddress: string
    operationsRegistryAddress: string
    accountFactoryAddress: string
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
  const accountFactoryHash = await registry.addEntry(
    CONTRACT_NAMES.common.ACCOUNT_FACTORY,
    addresses.accountFactoryAddress,
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
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.common.ACCOUNT_FACTORY} is ${accountFactoryHash}`,
    )
  }
}

async function addCommonActionsToRegistry(args: {
  registry: ServiceRegistry
  addresses: {
    pullTokenActionAddress: string
    sendTokenAddress: string
    setApprovalAddress: string
    flActionAddress: string
    swapActionAddress: string
    swapAddress: string
    wrapActionAddress: string
    unwrapActionAddress: string
    returnFundsActionAddress: string
    positionCreatedAddress: string
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
    addresses.sendTokenAddress,
  )
  const setApprovalHash = await registry.addEntry(
    CONTRACT_NAMES.common.SET_APPROVAL,
    addresses.setApprovalAddress,
  )
  const takeAFlashloanHash = await registry.addEntry(
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    addresses.flActionAddress,
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
    addresses.positionCreatedAddress,
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
    depositInAAVEAddress: string
    borrowFromAAVEAddress: string
    withdrawFromAAVEAddress: string
    actionPaybackFromAAVEAddress: string
    actionDepositInAAVEV3Address: string
    actionAaveV3BorrowAddress: string
    actionWithdrawFromAAVEV3Address: string
    actionPaybackFromAAVEV3Address: string
    actionSetEModeInAAVEV3Address: string
  }
  debug: boolean
}) {
  const { registry, addresses, debug } = args
  const depositInAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.DEPOSIT,
    addresses.depositInAAVEAddress,
  )
  const borromFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.BORROW,
    addresses.borrowFromAAVEAddress,
  )
  const withdrawFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.WITHDRAW,
    addresses.withdrawFromAAVEAddress,
  )
  const paybackToAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.v2.PAYBACK,
    addresses.actionPaybackFromAAVEAddress,
  )

  const depositInAAVEV3Hash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.DEPOSIT,
    addresses.actionDepositInAAVEV3Address,
  )

  const borrowFromAAVEV3Hash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.BORROW,
    addresses.actionAaveV3BorrowAddress,
  )

  const withdrawFromAAVEV3Hash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.WITHDRAW,
    addresses.actionWithdrawFromAAVEV3Address,
  )

  const paybackFromAAVEV3Hash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.PAYBACK,
    addresses.actionPaybackFromAAVEV3Address,
  )

  const setEModeInAAVEV3Hash = await registry.addEntry(
    CONTRACT_NAMES.aave.v3.SET_EMODE,
    addresses.actionSetEModeInAAVEV3Address,
  )

  if (debug) {
    console.log('==== ==== ====')
    console.log('ADDING AAVE ACTIONS TO REGISTRY')
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.DEPOSIT} is ${depositInAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.BORROW} is ${borromFromAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.WITHDRAW} is ${withdrawFromAAVEHash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v2.PAYBACK} is ${paybackToAAVEHash}`,
    )

    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.DEPOSIT} is ${depositInAAVEV3Hash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.BORROW} is ${borrowFromAAVEV3Hash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.WITHDRAW} is ${withdrawFromAAVEV3Hash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.PAYBACK} is ${paybackFromAAVEV3Hash}`,
    )
    console.log(
      `Service Registry Hash for contract: ${CONTRACT_NAMES.aave.v3.SET_EMODE} is ${setEModeInAAVEV3Hash}`,
    )
  }

  return {
    depositInAAVEHash,
    borromFromAAVEHash,
    withdrawFromAAVEHash,
    paybackToAAVEHash,
    depositInAAVEV3Hash,
    borrowFromAAVEV3Hash,
    withdrawFromAAVEV3Hash,
    paybackFromAAVEV3Hash,
    setEModeInAAVEV3Hash,
  }
}

async function addMakerActionsToRegistry() {
  // TODO: Deploy Maker actions
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
    depositInAAVEV3Hash: string
    borrowFromAAVEV3Hash: string
    withdrawFromAAVEV3Hash: string
    paybackFromAAVEV3Hash: string
    setEModeInAAVEV3Hash: string
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
    depositInAAVEV3Hash,
    borrowFromAAVEV3Hash,
    withdrawFromAAVEV3Hash,
    setEModeInAAVEV3Hash,
    swapActionHash,
    withdrawFromAAVEHash,
    wrapEthHash,
    unwrapEthHash,
    returnFundsHash,
    positionCreatedHash,
    sendTokenHash,
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
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.OPEN_POSITION, openPositionActions)

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v3.OPEN_POSITION, [
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
      hash: depositInAAVEV3Hash,
      optional: false,
    },
    {
      hash: borrowFromAAVEV3Hash,
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
      hash: depositInAAVEV3Hash,
      optional: false,
    },
    {
      hash: withdrawFromAAVEV3Hash,
      optional: false,
    },
    { hash: positionCreatedHash, optional: false },
    {
      hash: setEModeInAAVEV3Hash,
      optional: true,
    },
  ])

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
  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.CLOSE_POSITION, closePositionActions)

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
    OPERATION_NAMES.aave.v2.INCREASE_POSITION,
    increasePositionMultipleActions,
  )

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
      hash: depositInAAVEHash,
      optional: false,
    },
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.v2.BORROW, [
    {
      hash: borromFromAAVEHash,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: borromFromAAVEHash,
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
  ])

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
    OPERATION_NAMES.aave.v2.DECREASE_POSITION,
    decreasePositionMultipleActions,
  )

  // await operationsRegistry.addOp(OPERATION_NAMESNAMES.dma-common.CUSTOM_OPERATION, [])

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
      hash: paybackToAAVEHash,
      optional: true,
    },
    {
      hash: withdrawFromAAVEHash,
      optional: true,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: sendTokenHash,
      optional: true,
    },
    {
      hash: returnFundsHash,
      optional: true,
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
      hash: depositInAAVEHash,
      optional: false,
    },
    {
      hash: borromFromAAVEHash,
      optional: true,
    },
    {
      hash: unwrapEthHash,
      optional: true,
    },
    {
      hash: returnFundsHash,
      optional: true,
    },
    {
      hash: positionCreatedHash,
      optional: false,
    },
  ])

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
