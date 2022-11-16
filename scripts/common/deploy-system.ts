import { ADDRESSES } from '@oasisdex/oasis-actions/src/helpers/addresses'
import { CONTRACT_NAMES } from '@oasisdex/oasis-actions/src/helpers/constants'

import {
  McdView,
  ServiceRegistry,
  OperationExecutor,
  OperationStorage,
  OperationsRegistry,
  Swap,
  MakerOpenVault,
  CdpAllow,
  MakerDeposit,
  MakerGenerate,
  MakerPayback,
  MakerWithdraw,
  AaveBorrow,
  AaveDeposit,
  AaveWithdraw,
  PullToken,
  SendToken,
  SetApproval,
  SwapAction,
  TakeFlashloan,
  UnwrapEth,
  WrapEth,
  ReturnFunds,
  AavePayback,
} from '../../typechain'
import { AddressRegistry } from './addresses'
import { HardhatUtils } from './hardhat.utils'
import { Network } from './types'

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
      ethers.getContractFactory(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
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
