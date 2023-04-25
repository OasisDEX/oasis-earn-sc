import * as optimismSDK from '@eth-optimism/sdk'
import { TransactionRequest } from '@ethersproject/providers'
import { ADDRESSES } from '@oasisdex/addresses'
import { CONTRACT_NAMES, FIFTY, HUNDRED, MAX_UINT, ONE } from '@oasisdex/dma-common/constants'
import { swapUniswapTokens } from '@oasisdex/dma-common/test-utils'
import { BalanceOptions, RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { amountToWei, getServiceNameHash } from '@oasisdex/dma-common/utils/common'
import { createDeploy } from '@oasisdex/dma-common/utils/deploy'
import init from '@oasisdex/dma-common/utils/init'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { OperationsRegistry, ServiceRegistry } from '@oasisdex/dma-deployments/utils/wrappers'
import { ActionCall, ActionFactory, calldataTypes } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { Contract } from 'ethers'

const createAction = ActionFactory.create

export const DEPOSIT_OPERATION = 'DEPOSIT_OPERATION'
export const WITHDRAW_OPERATION = 'WITHDRAW_OPERATION'
export const BORROW_OPERATION = 'BORROW_OPERATION'
export const PAYBACK_OPERATION = 'PAYBACK_OPERATION'
export const aDAI = '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE'
export const vOptUSDC = '0xFCCf3cAbbe80101232d343252614b6A3eE81C989'

export const depositAction = (asset: string, amount: BigNumber) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.aave.v3.DEPOSIT),
    [calldataTypes.aaveV3.Deposit, calldataTypes.paramsMap],
    [
      {
        asset,
        amount: amount.toFixed(0),
        sumAmounts: false,
        setAsCollateral: false,
      },
      [0, 0, 0, 0],
    ],
  )

export const withdrawAction = (asset: string, amount: BigNumber, to: string) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.aave.v3.WITHDRAW),
    [calldataTypes.aaveV3.Withdraw, calldataTypes.paramsMap],
    [
      {
        asset,
        amount: amount.toFixed(0),
        to,
      },
      [0, 0, 0],
    ],
  )

export const borrowAction = (asset: string, amount: BigNumber, to: string) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.aave.v3.BORROW),
    [calldataTypes.aaveV3.Borrow, calldataTypes.paramsMap],
    [
      {
        asset,
        amount: amount.toFixed(0),
        to,
      },
      [0, 0, 0],
    ],
  )

export const paybackAction = (asset: string, amount: BigNumber, paybackAll: boolean) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.aave.v3.PAYBACK),
    [calldataTypes.aaveV3.Payback, calldataTypes.paramsMap],
    [
      {
        asset,
        amount: amount.toFixed(0),
        paybackAll,
      },
      [0, 0, 0],
    ],
  )

export const setApprovalAction = (asset: string, amount: BigNumber, delegate: string) =>
  createAction(
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    [calldataTypes.common.Approval, calldataTypes.paramsMap],
    [
      {
        asset,
        delegate,
        amount: amount.toFixed(0),
        sumAmounts: false,
      },
      [0, 0, 0, 0],
    ],
  )
type GasEstimates = {
  totalCost: BigNumber
  l1Cost: BigNumber
  l2Cost: BigNumber
  l1Gas: BigNumber
}
type DeployedContracts = {
  config: RuntimeConfig
  balanceConfig: BalanceOptions
  opExecutor: Contract
  depositActions: ActionCall[]
  withdrawActions: ActionCall[]
  borrowActions: ActionCall[]
  paybackActions: ActionCall[]
  estimateGas: (tx: TransactionRequest) => Promise<GasEstimates>
}

export const deployedContracts = async (): Promise<DeployedContracts> => {
  const config = await init()

  const deploy = await createDeploy({ config })
  const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
  const [opExecutor, operationExecutorAddress] = await deploy('OperationExecutor', [
    serviceRegistryAddress,
  ])
  const [, operationStorageAddress] = await deploy('OperationStorage', [
    serviceRegistryAddress,
    operationExecutorAddress,
  ])

  const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])

  const [, setApprovalAddress] = await deploy('SetApproval', [serviceRegistryAddress])
  const [, aaveV3L2DepositAddress] = await deploy('AaveV3L2Deposit', [serviceRegistryAddress])
  const [, aaveV3L2WithdrawAddress] = await deploy('AaveV3L2Withdraw', [serviceRegistryAddress])
  const [, aaveV3L2BorrowAddress] = await deploy('AaveV3L2Borrow', [serviceRegistryAddress])
  const [, aaveV3L2PaybackAddress] = await deploy('AaveV3L2Payback', [serviceRegistryAddress])

  const registry = new ServiceRegistry(serviceRegistryAddress, config.signer)
  const opRegistry = new OperationsRegistry(operationsRegistryAddress, config.signer)

  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
  await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
  await registry.addEntry(
    CONTRACT_NAMES.aave.v3.AAVE_POOL,
    ADDRESSES[Network.OPTIMISM].aave.v3.Pool,
  )
  await registry.addEntry(
    CONTRACT_NAMES.aave.L2_ENCODER,
    ADDRESSES[Network.OPTIMISM].aave.v3.L2Encoder,
  )
  await registry.addEntry(CONTRACT_NAMES.common.SET_APPROVAL, setApprovalAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.v3.DEPOSIT, aaveV3L2DepositAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.v3.WITHDRAW, aaveV3L2WithdrawAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.v3.BORROW, aaveV3L2BorrowAddress)
  await registry.addEntry(CONTRACT_NAMES.aave.v3.PAYBACK, aaveV3L2PaybackAddress)

  const depositActions = [
    setApprovalAction(
      ADDRESSES[Network.OPTIMISM].common.DAI,
      amountToWei(HUNDRED),
      ADDRESSES[Network.OPTIMISM].aave.v3.Pool,
    ),
    depositAction(ADDRESSES[Network.OPTIMISM].common.DAI, amountToWei(HUNDRED)),
  ]

  const withdrawActions = [
    withdrawAction(
      ADDRESSES[Network.OPTIMISM].common.DAI,
      new BigNumber(MAX_UINT),
      operationExecutorAddress,
    ),
  ]

  const borrowActions = [
    borrowAction(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      amountToWei(FIFTY, 6),
      operationExecutorAddress,
    ),
  ]

  const paybackActions = [
    setApprovalAction(
      ADDRESSES[Network.OPTIMISM].common.USDC,
      amountToWei(FIFTY.plus(ONE), 6),
      ADDRESSES[Network.OPTIMISM].aave.v3.Pool,
    ),
    paybackAction(ADDRESSES[Network.OPTIMISM].common.USDC, amountToWei(FIFTY.plus(ONE), 6), true),
  ]

  await opRegistry.addOp(
    DEPOSIT_OPERATION,
    depositActions.map((call: ActionCall) => ({
      hash: call.targetHash,
      optional: call.skipped,
    })),
  )

  await opRegistry.addOp(
    WITHDRAW_OPERATION,
    withdrawActions.map((call: ActionCall) => ({
      hash: call.targetHash,
      optional: call.skipped,
    })),
  )

  await opRegistry.addOp(
    BORROW_OPERATION,
    borrowActions.map((call: ActionCall) => ({
      hash: call.targetHash,
      optional: call.skipped,
    })),
  )

  await opRegistry.addOp(
    PAYBACK_OPERATION,
    paybackActions.map((call: ActionCall) => ({
      hash: call.targetHash,
      optional: call.skipped,
    })),
  )

  await swapUniswapTokens(
    ADDRESSES[Network.OPTIMISM].common.WETH,
    ADDRESSES[Network.OPTIMISM].common.DAI,
    amountToWei(ONE).toFixed(0),
    amountToWei(HUNDRED).toFixed(0),
    operationExecutorAddress,
    config,
  )

  await swapUniswapTokens(
    ADDRESSES[Network.OPTIMISM].common.WETH,
    ADDRESSES[Network.OPTIMISM].common.USDC,
    amountToWei(ONE).toFixed(0),
    amountToWei(HUNDRED, 6).toFixed(0),
    operationExecutorAddress,
    config,
  )

  const estimateGas = async (tx: TransactionRequest): Promise<GasEstimates> => {
    const provider = optimismSDK.asL2Provider(config.provider)

    return {
      totalCost: new BigNumber((await provider.estimateTotalGasCost(tx)).toString()),
      l1Cost: new BigNumber((await provider.estimateL1GasCost(tx)).toString()),
      l2Cost: new BigNumber((await provider.estimateL2GasCost(tx)).toString()),
      l1Gas: new BigNumber((await provider.estimateL1Gas(tx)).toString()),
    }
  }

  return {
    config,
    balanceConfig: {
      config,
      debug: false,
      isFormatted: true,
    },
    opExecutor,
    depositActions,
    withdrawActions,
    borrowActions,
    paybackActions,
    estimateGas,
  }
}
