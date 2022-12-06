import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions/src'
import { task } from 'hardhat/config'

import { createDeploy, DeployFunction } from '../../helpers/deploy'
import init from '../../helpers/init'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { RuntimeConfig } from '../../helpers/types/common'
import { OperationsRegistry } from '../../helpers/wrappers/operationsRegistry'

task(
  'deploy',
  'Deploy specific system. Use a "key" to select a contracts set from predefined ones.',
)
  .addFlag('debug', 'When used, deployed contract address is displayed')
  .addFlag('usefallbackswap', 'Use fallback (or dummy) swap contract')
  .setAction(async (taskArgs, hre) => {
    console.log('running')
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
    } = await deployCoreContacts(deploy)

    const {
      pullTokenActionAddress,
      sendTokenAddress,
      setApprovalAddress,
      flActionAddress,
      wrapActionAddress,
      unwrapActionAddress,
      returnFundsActionAddress,
      positionCreatedAddress,
    } = await deployCommonActions(deploy, serviceRegistryAddress)

    const {
      depositInAAVEAddress,
      borrowFromAAVEAddress,
      withdrawFromAAVEAddress,
      actionPaybackFromAAVEAddress,
      uSwapAddress,
      swapAddress,
      swapActionAddress,
    } = await deployAaveActions(deploy, serviceRegistryAddress, config)

    const registry: ServiceRegistry = new ServiceRegistry(serviceRegistryAddress, config.signer)
    await addThirdPartyContractsToRegistry(registry)

    await addCoreContractsToRegistry(registry, {
      operationExecutorAddress,
      operationStorageAddress,
      operationsRegistryAddress,
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
    } = await addCommonActionsToRegistry(registry, {
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
    })

    const { depositInAAVEHash, borromFromAAVEHash, withdrawFromAAVEHash, paybackToAAVEHash } =
      await addAAVEActionsToRegistry(registry, {
        depositInAAVEAddress,
        borrowFromAAVEAddress,
        withdrawFromAAVEAddress,
        actionPaybackFromAAVEAddress,
      })

    await addMakerActionsToRegistry()

    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      operationsRegistryAddress,
      config.signer,
    )
    await addAAVEOperationsToRegistry(operationsRegistry, {
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
    })
  })

async function deployCoreContacts(deploy: DeployFunction) {
  const [, serviceRegistryAddress] = await deploy(CONTRACT_NAMES.common.SERVICE_REGISTRY, [0])
  const [, operationsRegistryAddress] = await deploy(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, [])
  const [, operationExecutorAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_EXECUTOR, [
    serviceRegistryAddress,
  ])
  const [, operationStorageAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_STORAGE, [
    serviceRegistryAddress,
    operationExecutorAddress,
  ])

  return {
    serviceRegistryAddress,
    operationsRegistryAddress,
    operationExecutorAddress,
    operationStorageAddress,
  }
}

async function deployCommonActions(deploy: DeployFunction, serviceRegistryAddress: string) {
  const [, pullTokenActionAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])
  const [, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [])
  const [, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [
    serviceRegistryAddress,
  ])
  const [, flActionAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
    serviceRegistryAddress,
    ADDRESSES.main.DAI,
  ])

  const [, wrapActionAddress] = await deploy(CONTRACT_NAMES.common.WRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [, unwrapActionAddress] = await deploy(CONTRACT_NAMES.common.UNWRAP_ETH, [
    serviceRegistryAddress,
  ])
  const [, positionCreatedAddress] = await deploy(CONTRACT_NAMES.common.POSITION_CREATED, [])
  const [, returnFundsActionAddress] = await deploy(CONTRACT_NAMES.common.RETURN_FUNDS, [])

  return {
    pullTokenActionAddress,
    sendTokenAddress,
    setApprovalAddress,
    flActionAddress,
    wrapActionAddress,
    unwrapActionAddress,
    returnFundsActionAddress,
    positionCreatedAddress,
  }
}

async function deployAaveActions(
  deploy: DeployFunction,
  serviceRegistryAddress: string,
  config: RuntimeConfig,
) {
  const [, depositInAAVEAddress] = await deploy(CONTRACT_NAMES.aave.DEPOSIT, [
    serviceRegistryAddress,
  ])
  const [, borrowFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.BORROW, [
    serviceRegistryAddress,
  ])
  const [, withdrawFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.WITHDRAW, [
    serviceRegistryAddress,
  ])
  const [, actionPaybackFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.PAYBACK, [
    serviceRegistryAddress,
  ])
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

  const [, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
    serviceRegistryAddress,
  ])

  return {
    depositInAAVEAddress,
    borrowFromAAVEAddress,
    withdrawFromAAVEAddress,
    actionPaybackFromAAVEAddress,
    uSwapAddress,
    swapAddress,
    swapActionAddress,
  }
}

async function addThirdPartyContractsToRegistry(registry: ServiceRegistry) {
  await registry.addEntry(CONTRACT_NAMES.common.UNISWAP_ROUTER, ADDRESSES.main.uniswapRouterV3)
  await registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.maker.fmm)
  await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)
  await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
  await registry.addEntry(
    CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
    ADDRESSES.main.oneInchAggregator,
  )
  await registry.addEntry(CONTRACT_NAMES.aave.LENDING_POOL, ADDRESSES.main.aave.MainnetLendingPool)
  await registry.addEntry(CONTRACT_NAMES.aave.WETH_GATEWAY, ADDRESSES.main.aave.WETHGateway)
}

async function addCoreContractsToRegistry(
  registry: ServiceRegistry,
  addresses: {
    operationExecutorAddress: string
    operationStorageAddress: string
    operationsRegistryAddress: string
  },
) {
  await registry.addEntry(
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    addresses.operationExecutorAddress,
  )
  await registry.addEntry(
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    addresses.operationStorageAddress,
  )
  await registry.addEntry(
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    addresses.operationsRegistryAddress,
  )
}

async function addCommonActionsToRegistry(
  registry: ServiceRegistry,
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
  },
) {
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
  await registry.addEntry(CONTRACT_NAMES.common.SWAP, addresses.swapAddress)
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

async function addAAVEActionsToRegistry(
  registry: ServiceRegistry,
  addresses: {
    depositInAAVEAddress: string
    borrowFromAAVEAddress: string
    withdrawFromAAVEAddress: string
    actionPaybackFromAAVEAddress: string
  },
) {
  const depositInAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.DEPOSIT,
    addresses.depositInAAVEAddress,
  )
  const borromFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.BORROW,
    addresses.borrowFromAAVEAddress,
  )
  const withdrawFromAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.WITHDRAW,
    addresses.withdrawFromAAVEAddress,
  )
  const paybackToAAVEHash = await registry.addEntry(
    CONTRACT_NAMES.aave.PAYBACK,
    addresses.actionPaybackFromAAVEAddress,
  )

  return {
    depositInAAVEHash,
    borromFromAAVEHash,
    withdrawFromAAVEHash,
    paybackToAAVEHash,
  }
}

async function addMakerActionsToRegistry() {
  // TODO: Deploy Maker actions
}

async function addAAVEOperationsToRegistry(
  operationsRegistry: OperationsRegistry,
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
  },
) {
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

  await operationsRegistry.addOp(OPERATION_NAMES.aave.OPEN_POSITION, [
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
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.CLOSE_POSITION, [
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
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.INCREASE_POSITION, [
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
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.aave.DECREASE_POSITION, [
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
      hash: depositInAAVEHash,
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
  ])

  await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])
}
