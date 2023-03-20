import { ADDRESSES, CONTRACT_NAMES } from '@oasisdex/dupa-library/src'

import { AddressRegistry } from './addresses'
import { HardhatUtils } from './hardhat.utils'
import { Network } from './types'
import { removeVersion } from './utils'
import {
  OperationExecutor,
  OperationsRegistry,
  OperationStorage,
  ServiceRegistry,
} from '@typechain/artifacts/contracts/core'
import {
  PositionCreated,
  PullToken,
  ReturnFunds,
  SendToken,
  SetApproval,
  SwapAction,
  TakeFlashloan,
  UnwrapEth,
  WrapEth,
} from '@typechain/artifacts/contracts/actions/common'
import { AaveBorrow } from '@typechain/artifacts/contracts/actions/aave/v2/Borrow.sol'
import { MakerOpenVault } from '@typechain/artifacts/contracts/actions/maker/OpenVault.sol'
import { AaveDeposit } from '@typechain/artifacts/contracts/actions/aave/v2/Deposit.sol'
import { McdView } from '@typechain/artifacts/contracts/core/views'
import { Swap } from '@typechain/artifacts/contracts/swap'
import { MakerDeposit } from '@typechain/artifacts/contracts/actions/maker/Deposit.sol'
import { MakerPayback } from '@typechain/artifacts/contracts/actions/maker/Payback.sol'
import { AaveWithdraw } from '@typechain/artifacts/contracts/actions/aave/v2/Withdraw.sol'
import { AavePayback } from '@typechain/artifacts/contracts/actions/aave/v2/Payback.sol'
import { CdpAllow } from '@typechain/artifacts/contracts/actions/maker'
import { MakerGenerate } from '@typechain/artifacts/contracts/actions/maker/Generate.sol'
import { MakerWithdraw } from '@typechain/artifacts/contracts/actions/maker/Withdraw.sol'

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
