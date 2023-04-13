import { ADDRESSES } from '@oasisdex/addresses'
import { AaveBorrow } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Borrow.sol'
import { AaveDeposit } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Deposit.sol'
import { AavePayback } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Payback.sol'
import { AaveWithdraw } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/aave/v2/Withdraw.sol'
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
} from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/common'
import { CdpAllow } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker'
import { MakerDeposit } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker/Deposit.sol'
import { MakerGenerate } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker/Generate.sol'
import { MakerOpenVault } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker/OpenVault.sol'
import { MakerPayback } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker/Payback.sol'
import { MakerWithdraw } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/actions/maker/Withdraw.sol'
import {
  OperationExecutor,
  OperationsRegistry,
  OperationStorage,
  ServiceRegistry,
} from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/core'
import { McdView } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/core/views'
import { Swap } from '@oasisdex/dma-contracts/typechain/dma-contracts/artifacts/contracts/swap'
import { removeVersion } from '@utils/deploy'
import { Network } from '@utils/network'

import { CONTRACT_NAMES } from '../../constants'
import { AddressRegistry } from './addresses'
import { HardhatUtils } from './hardhat.utils'

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
