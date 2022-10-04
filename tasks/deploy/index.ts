import { ADDRESSES, CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions/src'
import { task } from 'hardhat/config'

import { createDeploy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { OperationsRegistry } from '../../helpers/wrappers/operationsRegistry'

task(
  'deploy',
  'Deploy specific system. Use a "key" to select a contracts set from predefined ones.',
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

    // Core System Smart Contracts
    const [, serviceRegistryAddress] = await deploy(CONTRACT_NAMES.common.SERVICE_REGISTRY, [0])
    const [, operationsRegistryAddress] = await deploy(
      CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
      [],
    )
    const [, operationExecutorAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_EXECUTOR, [
      serviceRegistryAddress,
    ])
    const [, operationStorageAddress] = await deploy(CONTRACT_NAMES.common.OPERATION_STORAGE, [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])

    // Common Actions Smart Contracts
    const [, pullTokenActionAddress] = await deploy(CONTRACT_NAMES.common.PULL_TOKEN, [])
    const [, sendTokenAddress] = await deploy(CONTRACT_NAMES.common.SEND_TOKEN, [])
    const [, setApprovalAddress] = await deploy(CONTRACT_NAMES.common.SET_APPROVAL, [
      serviceRegistryAddress,
    ])
    const [, flActionAddress] = await deploy(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, [
      serviceRegistryAddress,
      ADDRESSES.main.DAI,
    ])

    // AAVE Specific Actions Smart Contracts
    const [, depositInAAVEAddress] = await deploy(CONTRACT_NAMES.aave.DEPOSIT, [
      serviceRegistryAddress,
    ])
    const [, borrowFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.BORROW, [
      serviceRegistryAddress,
    ])
    const [, withdrawFromAAVEAddress] = await deploy(CONTRACT_NAMES.aave.WITHDRAW, [
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

    const [, swapAddress] = await deploy(CONTRACT_NAMES.common.SWAP, [
      config.address,
      ADDRESSES.main.feeRecipient,
      0, // TODO add different fee tiers
      serviceRegistryAddress,
    ])
    const [, swapActionAddress] = await deploy(CONTRACT_NAMES.common.SWAP_ACTION, [
      serviceRegistryAddress,
    ])

    // Adding records in Service Registry
    const registry: ServiceRegistry = new ServiceRegistry(serviceRegistryAddress, config.signer)
    await registry.addEntry(CONTRACT_NAMES.common.UNISWAP_ROUTER, ADDRESSES.main.uniswapRouterV3)
    await registry.addEntry(CONTRACT_NAMES.maker.FLASH_MINT_MODULE, ADDRESSES.main.maker.fmm)
    await registry.addEntry(CONTRACT_NAMES.common.WETH, ADDRESSES.main.WETH)
    await registry.addEntry(CONTRACT_NAMES.common.DAI, ADDRESSES.main.DAI)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
    await registry.addEntry(
      CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
      ADDRESSES.main.oneInchAggregator,
    )
    await registry.addEntry(
      CONTRACT_NAMES.aave.LENDING_POOL,
      ADDRESSES.main.aave.MainnetLendingPool,
    )
    await registry.addEntry(CONTRACT_NAMES.aave.WETH_GATEWAY, ADDRESSES.main.aave.WETHGateway)

    const pullTokenHash = await registry.addEntry(
      CONTRACT_NAMES.common.PULL_TOKEN,
      pullTokenActionAddress,
    )
    const sendTokenHash = await registry.addEntry(
      CONTRACT_NAMES.common.SEND_TOKEN,
      sendTokenAddress,
    )
    const setApprovalHash = await registry.addEntry(
      CONTRACT_NAMES.common.SET_APPROVAL,
      setApprovalAddress,
    )
    const takeAFlashloanHash = await registry.addEntry(
      CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
      flActionAddress,
    )
    const depositInAAVEHash = await registry.addEntry(
      CONTRACT_NAMES.aave.DEPOSIT,
      depositInAAVEAddress,
    )
    const borromFromAAVEHash = await registry.addEntry(
      CONTRACT_NAMES.aave.BORROW,
      borrowFromAAVEAddress,
    )
    const withdrawFromAAVEHash = await registry.addEntry(
      CONTRACT_NAMES.aave.WITHDRAW,
      withdrawFromAAVEAddress,
    )
    await registry.addEntry(
      CONTRACT_NAMES.common.SWAP,
      taskArgs.usefallbackswap ? uSwapAddress : swapAddress,
    )
    const swapActionHash = await registry.addEntry(
      CONTRACT_NAMES.common.SWAP_ACTION,
      swapActionAddress,
    )

    // Adding records in Operations Registry
    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      operationsRegistryAddress,
      config.signer,
    )
    await operationsRegistry.addOp(OPERATION_NAMES.aave.OPEN_POSITION, [
      pullTokenHash,
      takeAFlashloanHash,
      setApprovalHash,
      depositInAAVEHash,
      borromFromAAVEHash,
      swapActionHash,
      withdrawFromAAVEHash,
      sendTokenHash,
    ])

    await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])
  })
