import { CONTRACT_NAMES } from '@oasisdex/dma-common/constants'
import { getAddressesFor } from '@oasisdex/dma-common/utils/common/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { utils } from 'ethers'
import { task } from 'hardhat/config'

task('get-hashes', 'get Addresses hashes').setAction(async (_: any, hre) => {
  const { name: network } = hre.network
  console.log(`Network: ${network}. Verifying contracts...\n`)
  const {
    OPERATION_EXECUTOR,
    OPERATION_STORAGE,
    OPERATIONS_REGISTRY,
    PULL_TOKEN_ACTION,
    SEND_TOKEN_ACTION,
    SET_APPROVAL_ACTION,
    SWAP_ACTION,
    TAKE_FLASHLOAN_ACTION,
    UNWRAP_ETH_ACTION,
    WRAP_ETH_ACTION,
    RETURN_FUNDS_ACTION,
    AAVE_BORROW_ACTION,
    AAVE_DEPOSIT_ACTION,
    AAVE_WITHDRAW_ACTION,
    AAVE_PAYBACK_ACTION,
    POSITION_CREATED_ACTION,
  } = await getAddressesFor(network as Network)

  const opExecutorHash = utils.keccak256(
    utils.toUtf8Bytes(CONTRACT_NAMES.common.OPERATION_EXECUTOR),
  )
  console.log(
    'OPERATION_EXECUTOR',
    OPERATION_EXECUTOR,
    CONTRACT_NAMES.common.OPERATION_EXECUTOR,
    opExecutorHash,
  )

  const opStorageHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.OPERATION_STORAGE))
  console.log(
    'OPERATION_STORAGE',
    OPERATION_STORAGE,
    CONTRACT_NAMES.common.OPERATION_STORAGE,
    opStorageHash,
  )

  const opRegistryHash = utils.keccak256(
    utils.toUtf8Bytes(CONTRACT_NAMES.common.OPERATIONS_REGISTRY),
  )
  console.log(
    'OPERATIONS_REGISTRY',
    OPERATIONS_REGISTRY,
    CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
    opRegistryHash,
  )

  const pullTokenHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.PULL_TOKEN))
  console.log(
    'PULL_TOKEN_ACTION',
    PULL_TOKEN_ACTION,
    CONTRACT_NAMES.common.PULL_TOKEN,
    pullTokenHash,
  )

  const sendTokenHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.SEND_TOKEN))
  console.log(
    'SEND_TOKEN_ACTION',
    SEND_TOKEN_ACTION,
    CONTRACT_NAMES.common.SEND_TOKEN,
    sendTokenHash,
  )

  const setApprovalHash = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.SET_APPROVAL))
  console.log(
    'SET_APPROVAL_ACTION',
    SET_APPROVAL_ACTION,
    CONTRACT_NAMES.common.SET_APPROVAL,
    setApprovalHash,
  )

  const swapAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.SWAP_ACTION))
  console.log('SWAP_ACTION', SWAP_ACTION, CONTRACT_NAMES.common.SWAP_ACTION, swapAction)

  const takeFlashloanAction = utils.keccak256(
    utils.toUtf8Bytes(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
  )
  console.log(
    'TAKE_FLASHLOAN_ACTION',
    TAKE_FLASHLOAN_ACTION,
    CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
    takeFlashloanAction,
  )

  const positionCreatedAction = utils.keccak256(
    utils.toUtf8Bytes(CONTRACT_NAMES.common.POSITION_CREATED),
  )
  console.log(
    'POSITION_CREATED',
    POSITION_CREATED_ACTION,
    CONTRACT_NAMES.common.POSITION_CREATED,
    positionCreatedAction,
  )

  const unwrapAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.UNWRAP_ETH))
  console.log(
    'UNWRAP_ETH_ACTION',
    UNWRAP_ETH_ACTION,
    CONTRACT_NAMES.common.UNWRAP_ETH,
    unwrapAction,
  )

  const wrapAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.WRAP_ETH))
  console.log('WRAP_ETH_ACTION', WRAP_ETH_ACTION, CONTRACT_NAMES.common.WRAP_ETH, wrapAction)

  const returnFundsAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.common.RETURN_FUNDS))
  console.log(
    'RETURN_FUNDS_ACTION',
    RETURN_FUNDS_ACTION,
    CONTRACT_NAMES.common.RETURN_FUNDS,
    returnFundsAction,
  )

  const aaveBorrowAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.aave.v2.BORROW))
  console.log(
    'AAVE_BORROW_ACTION',
    AAVE_BORROW_ACTION,
    CONTRACT_NAMES.aave.v2.BORROW,
    aaveBorrowAction,
  )

  const aaveDepositAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.aave.v2.DEPOSIT))
  console.log(
    'AAVE_DEPOSIT_ACTION',
    AAVE_DEPOSIT_ACTION,
    CONTRACT_NAMES.aave.v2.DEPOSIT,
    aaveDepositAction,
  )

  const aaveWithdrawAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.aave.v2.WITHDRAW))
  console.log(
    'AAVE_WITHDRAW_ACTION',
    AAVE_WITHDRAW_ACTION,
    CONTRACT_NAMES.aave.v2.WITHDRAW,
    aaveWithdrawAction,
  )

  const aavePaybackAction = utils.keccak256(utils.toUtf8Bytes(CONTRACT_NAMES.aave.v2.PAYBACK))
  console.log(
    'AAVE_PAYBACK_ACTION',
    AAVE_PAYBACK_ACTION,
    CONTRACT_NAMES.aave.v2.PAYBACK,
    aavePaybackAction,
  )
})
