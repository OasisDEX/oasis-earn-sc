import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import { constants } from 'ethers'

import {
  AaveBorrow,
  AaveDeposit,
  AaveWithdraw,
  CdpAllow,
  MakerDeposit,
  MakerGenerate,
  MakerOpenVault,
  MakerPayback,
  MakerWithdraw,
  McdView,
  OperationExecutor,
  OperationsRegistry,
  OperationStorage,
  PullToken,
  SendToken,
  ServiceRegistry,
  SetApproval,
  SwapAction,
  TakeFlashloan,
} from '../../typechain'
import { AddressRegistry } from './addresses'
import { HardhatUtils } from './hardhat.utils'
import { Network } from './types'
import { getServiceNameHash } from './utils'

export interface DeployedSystem {
  serviceRegistry: ServiceRegistry
  operationExecutor: OperationExecutor
  operationsRegistry: OperationsRegistry
  operationStorage: OperationStorage
  mcdView?: McdView
  cdpAllow?: CdpAllow
  makerOpenVault?: MakerOpenVault
  makerDeposit?: MakerDeposit
  makerGenerate?: MakerGenerate
  makerPayback?: MakerPayback
  makerWithdraw?: MakerWithdraw
  aaveBorrow?: AaveBorrow
  aaveDeposit?: AaveDeposit
  aaveWithdraw?: AaveWithdraw
  pullToken?: PullToken
  sendToken?: SendToken
  setApproval?: SetApproval
  swap?: SwapAction
  takeFlashloan?: TakeFlashloan
}

export interface DeploySystemArgs {
  utils: HardhatUtils
  logDebug?: boolean
  addressOverrides?: Partial<AddressRegistry>
}

const createServiceRegistry = (
  utils: HardhatUtils,
  serviceRegistry: ServiceRegistry,
  overwrite: string[] = [],
) => {
  return async (hash: string, address: string): Promise<void> => {
    if (address === constants.AddressZero) {
      console.log(
        `WARNING: attempted to add zero address to ServiceRegistry. Hash: ${hash}. Skipping...`,
      )
      return
    }

    let existingAddress = constants.AddressZero
    try {
      existingAddress = await serviceRegistry.getServiceAddress(hash)
    } catch (err) {}

    const gasSettings = await utils.getGasSettings()
    if (existingAddress === constants.AddressZero) {
      await (await serviceRegistry.addNamedService(hash, address, gasSettings)).wait()
    } else if (overwrite.includes(hash)) {
      await (await serviceRegistry.updateNamedService(hash, address, gasSettings)).wait()
    } else {
      console.log(
        `WARNING: attempted to change service registry entry, but overwrite is not allowed. Hash: ${hash}. Address: ${address}`,
      )
    }
  }
}

export async function deploySystem({
  utils,
  logDebug = false,
  addressOverrides = {},
}: DeploySystemArgs): Promise<DeployedSystem> {
  let ServiceRegistryInstance: ServiceRegistry
  let OperationExecutorInstance: OperationExecutor
  let OperationsRegistryInstance: OperationsRegistry
  let OperationStorageInstance: OperationStorage

  const delay = utils.hre.network.name === Network.MAINNET ? 1800 : 0

  const { ethers } = utils.hre
  const addresses = { ...utils.addresses, ...addressOverrides }

  const defaultSystem = await utils.getDefaultSystem()

  if (defaultSystem.serviceRegistry.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying ServiceRegistry....')
    ServiceRegistryInstance = await utils.deployContract(
      ethers.getContractFactory('ServiceRegistry'),
      [delay],
    )
  } else {
    ServiceRegistryInstance = defaultSystem.serviceRegistry
  }

  if (defaultSystem.operationExecutor.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationExecutor....')
    OperationExecutorInstance = await utils.deployContract(
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      [ServiceRegistryInstance.address],
    )
  } else {
    OperationExecutorInstance = defaultSystem.operationExecutor
  }

  if (defaultSystem.operationsRegistry.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationsRegistry....')
    OperationsRegistryInstance = await utils.deployContract(
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATIONS_REGISTRY),
      [],
    )
  } else {
    OperationsRegistryInstance = defaultSystem.operationsRegistry
  }

  if (defaultSystem.operationStorage.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationStorage....')
    OperationStorageInstance = await utils.deployContract(
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATION_STORAGE),
      [ServiceRegistryInstance.address, OperationExecutorInstance.address],
    )
  } else {
    OperationStorageInstance = defaultSystem.operationStorage
  }

  if (logDebug) {
    console.log(`AUTOMATION_SERVICE_REGISTRY: '${ServiceRegistryInstance.address}',`)
    console.log(`OPERATION_EXECUTOR: '${OperationExecutorInstance.address}',`)
    console.log(`OPERATIONS_REGISTRY: '${OperationsRegistryInstance.address}',`)
    console.log(`OPERATION_STORAGE: '${OperationStorageInstance.address}',`)
  }

  const system: DeployedSystem = {
    serviceRegistry: ServiceRegistryInstance,
    operationExecutor: OperationExecutorInstance,
    operationsRegistry: OperationsRegistryInstance,
    operationStorage: OperationStorageInstance,
  }

  await configureRegistryEntries(utils, system, addresses as AddressRegistry, [], logDebug)
  return system
}

export async function configureRegistryEntries(
  utils: HardhatUtils,
  system: DeployedSystem,
  addresses: AddressRegistry,
  overwrite: string[] = [],
  logDebug = false,
) {
  const ensureServiceRegistryEntry = createServiceRegistry(utils, system.serviceRegistry, overwrite)

  if (system.operationExecutor && system.operationExecutor.address !== constants.AddressZero) {
    if (logDebug) console.log(`Adding operationExecutor to ServiceRegistry....`)
    await ensureServiceRegistryEntry(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
      system.operationExecutor.address,
    )
  }
  if (system.operationsRegistry && system.operationsRegistry.address !== constants.AddressZero) {
    if (logDebug) console.log(`Adding operationsRegistry to ServiceRegistry....`)
    await ensureServiceRegistryEntry(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATIONS_REGISTRY),
      system.operationsRegistry.address,
    )
  }
  if (system.operationStorage && system.operationStorage.address !== constants.AddressZero) {
    if (logDebug) console.log(`Adding operationStorage to ServiceRegistry....`)
    await ensureServiceRegistryEntry(
      getServiceNameHash(CONTRACT_NAMES.common.OPERATION_STORAGE),
      system.operationStorage.address,
    )
  }

  if (logDebug) console.log('Adding CDP_MANAGER to ServiceRegistry....')
  await ensureServiceRegistryEntry(
    getServiceNameHash(CONTRACT_NAMES.maker.MCD_MANAGER),
    addresses.CDP_MANAGER,
  )

  if (logDebug) console.log('Adding MCD_FLASH to ServiceRegistry....')
  await ensureServiceRegistryEntry(
    getServiceNameHash(CONTRACT_NAMES.maker.FLASH_MINT_MODULE),
    addresses.MCD_FLASH,
  )

  // if (logDebug) console.log('Adding MCD_VIEW to ServiceRegistry....')
  // await ensureServiceRegistryEntry(getServiceNameHash(AutomationServiceName.MCD_VIEW), system.mcdView.address)
}
