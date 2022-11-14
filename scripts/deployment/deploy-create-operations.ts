import { CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions'
import hre from 'hardhat'

import { getServiceNameHash, HardhatUtils } from '../common'

async function main() {
  const utils = new HardhatUtils(hre) // the hardhat network is coalesced to mainnet
  const signer = hre.ethers.provider.getSigner(0)
  const network = hre.network.name || ''
  console.log(`Deployer address: ${await signer.getAddress()}`)
  console.log(`Network: ${network}`)

  const system = await utils.getDefaultSystem()

  console.log('OperationsRegistry Address:', system.operationsRegistry.address)

  console.log(`Adding ${OPERATION_NAMES.common.CUSTOM_OPERATION} to OperationsRegistry...`)
  await system.operationsRegistry.addOperation(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

  console.log(`Adding ${OPERATION_NAMES.aave.OPEN_POSITION} to OperationsRegistry...`)
  const openAPositionActions = [
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.BORROW),
    getServiceNameHash(CONTRACT_NAMES.common.WRAP_ETH),
    getServiceNameHash(CONTRACT_NAMES.common.SWAP_ACTION),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
  ]
  await system.operationsRegistry.addOperation(
    OPERATION_NAMES.aave.OPEN_POSITION,
    openAPositionActions,
  )

  const closeAPositionActions = [
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
    getServiceNameHash(CONTRACT_NAMES.common.SWAP_ACTION),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.PAYBACK),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
    getServiceNameHash(CONTRACT_NAMES.common.UNWRAP_ETH),
    getServiceNameHash(CONTRACT_NAMES.common.RETURN_FUNDS),
  ]
  console.log(`Adding ${OPERATION_NAMES.aave.CLOSE_POSITION} to OperationsRegistry...`)
  await system.operationsRegistry.addOperation(
    OPERATION_NAMES.aave.CLOSE_POSITION,
    closeAPositionActions,
  )

  const increaseAPositionActions = [
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.BORROW),
    getServiceNameHash(CONTRACT_NAMES.common.WRAP_ETH),
    getServiceNameHash(CONTRACT_NAMES.common.SWAP_ACTION),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
  ]
  console.log(`Adding ${OPERATION_NAMES.aave.INCREASE_POSITION} to OperationsRegistry...`)
  await system.operationsRegistry.addOperation(
    OPERATION_NAMES.aave.INCREASE_POSITION,
    increaseAPositionActions,
  )

  const decreaseAPositionActions = [
    getServiceNameHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.DEPOSIT),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
    getServiceNameHash(CONTRACT_NAMES.common.SWAP_ACTION),
    getServiceNameHash(CONTRACT_NAMES.common.SET_APPROVAL),
    getServiceNameHash(CONTRACT_NAMES.aave.PAYBACK),
    getServiceNameHash(CONTRACT_NAMES.aave.WITHDRAW),
  ]
  console.log(`Adding ${OPERATION_NAMES.aave.DECREASE_POSITION} to OperationsRegistry...`)
  await system.operationsRegistry.addOperation(
    OPERATION_NAMES.aave.DECREASE_POSITION,
    decreaseAPositionActions,
  )
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
