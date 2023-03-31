import { Network } from '@helpers/network'
import { ServiceRegistry as ServiceRegistryClass } from '@helpers/serviceRegistry'
import { PartialRecord } from '@helpers/types/common'
import { ADDRESSES } from '@oasisdex/oasis-actions/src'
import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'
import { Contract } from 'ethers'

import {
  AaveBorrow,
  AaveDeposit,
  AavePayback,
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
  PositionCreated,
  PullToken,
  ReturnFunds,
  SendToken,
  ServiceRegistry,
  SetApproval,
  Swap,
  SwapAction,
  TakeFlashloan,
  UnwrapEth,
  WrapEth,
} from '../../typechain'
import { AddressRegistry } from './addresses'
import { Config, ConfigItem, CoreContractNames, DeployedSystemContractNames } from './config-item'
import { HardhatUtils } from './hardhat.utils'
import { removeVersion } from './utils'

export type ContractProps = {
  contract: Contract
  config: ConfigItem | Record<string, unknown>
  hash: string
}

export type SystemTemplate20 = PartialRecord<DeployedSystemContractNames, ContractProps>

export type DeployedSystem20Return = SystemTemplate20 & Record<CoreContractNames, ContractProps>

export type DeployedSystem20 = {
  system: DeployedSystem20Return
  registry: ServiceRegistryClass
  config: Config
}

/**
 * @deprecated This is the old DeployedSystem interface which is still used by some tests
 */
export interface DeployedSystem {
  serviceRegistry: ServiceRegistry
  operationExecutor: OperationExecutor
  operationsRegistry: OperationsRegistry
  operationStorage: OperationStorage
  swap: Swap
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
  aavePayback?: AavePayback
  pullToken?: PullToken
  sendToken?: SendToken
  setApproval?: SetApproval
  swapAction?: SwapAction
  takeFlashloan?: TakeFlashloan
  unwrapEth?: UnwrapEth
  wrapEth?: WrapEth
  returnFunds?: ReturnFunds
  positionCreated?: PositionCreated
}

export interface DeploySystemArgs {
  utils: HardhatUtils
  logDebug?: boolean
  addressOverrides?: Partial<AddressRegistry>
}

export async function deploySystem({
  utils,
  logDebug = false,
}: DeploySystemArgs): Promise<DeployedSystem> {
  const { ethers } = utils.hre
  const delay = utils.hre.network.name === Network.MAINNET ? 1800 : 0

  let { serviceRegistry, operationExecutor, operationsRegistry, operationStorage, swap } =
    await utils.getDefaultSystem()

  if (serviceRegistry.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying ServiceRegistry....')
    serviceRegistry = await utils.deployContract(ethers.getContractFactory('ServiceRegistry'), [
      delay,
    ])
  }

  if (operationExecutor.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationExecutor....')
    operationExecutor = await utils.deployContract(
      ethers.getContractFactory(removeVersion(CONTRACT_NAMES.common.OPERATION_EXECUTOR)),
      [serviceRegistry.address],
    )
  }

  if (operationsRegistry.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationsRegistry....')
    operationsRegistry = await utils.deployContract(
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATIONS_REGISTRY),
      [],
    )
  }

  if (operationStorage.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying OperationStorage....')
    operationStorage = await utils.deployContract(
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATION_STORAGE),
      [serviceRegistry.address, operationExecutor.address],
    )
  }

  if (swap.address === ethers.constants.AddressZero) {
    if (logDebug) console.log('Deploying Swap....', serviceRegistry.address)
    swap = await utils.deployContract(ethers.getContractFactory(CONTRACT_NAMES.common.SWAP), [
      ADDRESSES.main.authorizedCaller,
      ADDRESSES.main.feeRecipient,
      20,
      serviceRegistry.address,
    ])
  }

  if (logDebug) {
    console.log(`AUTOMATION_SERVICE_REGISTRY: '${serviceRegistry.address}',`)
    console.log(`OPERATION_EXECUTOR: '${operationExecutor.address}',`)
    console.log(`OPERATIONS_REGISTRY: '${operationsRegistry.address}',`)
    console.log(`OPERATION_STORAGE: '${operationStorage.address}',`)
    console.log(`SWAP: '${swap.address}',`)
  }

  const system: DeployedSystem = {
    serviceRegistry,
    operationExecutor,
    operationsRegistry,
    operationStorage,
    swap,
  }

  return system
}
