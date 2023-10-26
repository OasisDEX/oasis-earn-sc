import { getConfigByNetwork } from '@deploy-configurations/configs'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { input } from '@inquirer/prompts'
import { OperationsRegistry, ServiceRegistry } from '@typechain/index'
import { Signer } from 'ethers'
import { task, types } from 'hardhat/config'

import {
  getOperationRegistry,
  getServiceRegistry,
  isInvalidAddress,
  OperationRegistryMaybe,
  ServiceRegistryMaybe,
} from '../common'

type ContractOwnership = {
  address: string
  owner: string
  requiredDelay: number
}

type SystemOwnership = {
  serviceRegistry: ContractOwnership
  operationsRegistry: ContractOwnership
}

type System = {
  config: SystemConfig
  serviceRegistry: ServiceRegistry
  operationsRegistry: OperationsRegistry
}

type PendingChange = {
  serviceRegistry: {
    isPending: boolean
    waitingTimeSecs: number
  }
}

function printOwnership(systemOwnership: SystemOwnership, network: string, title = 'OWNERSHIP') {
  console.log(`\n====== ${title} ======`)
  console.log(`Network: ${network}\n`)
  console.log(`ServiceRegistry: ${systemOwnership.serviceRegistry.address}`)
  console.log(`ServiceRegistry owner: ${systemOwnership.serviceRegistry.owner}`)
  console.log(`ServiceRegistry required delay: ${systemOwnership.serviceRegistry.requiredDelay}`)

  console.log(``)

  console.log(`OperationsRegistry: ${systemOwnership.operationsRegistry.address}`)
  console.log(`OperationsRegistry owner: ${systemOwnership.operationsRegistry.owner}`)
  console.log(
    `OperationsRegistry required delay: ${systemOwnership.operationsRegistry.requiredDelay}`,
  )
  console.log('==============================\n')
}

async function getSystem(
  network: string,
  ethers: any,
  signer?: Signer,
): Promise<System | undefined> {
  const config: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig

  const serviceRegistry: ServiceRegistryMaybe = await getServiceRegistry(
    signer ? signer : ethers.provider,
    config,
  )
  if (!serviceRegistry) {
    console.log('ServiceRegistry not deployed, cannot fetch values')
    return undefined
  }

  const operationsRegistry: OperationRegistryMaybe = await getOperationRegistry(
    signer ? signer : ethers.provider,
    config,
  )
  if (!operationsRegistry) {
    console.log('OperationsRegistry not deployed, cannot fetch values')
    return undefined
  }

  return {
    config,
    serviceRegistry,
    operationsRegistry,
  }
}

async function getSystemOwnership(system: System): Promise<SystemOwnership | undefined> {
  const serviceRegistryOwner = await system.serviceRegistry.owner()
  const serviceRegistryRequiredDelay = await system.serviceRegistry.requiredDelay()

  const operationsRegistryOwner = await system.operationsRegistry.owner()

  return {
    serviceRegistry: {
      address: system.serviceRegistry.address,
      owner: serviceRegistryOwner,
      requiredDelay: serviceRegistryRequiredDelay.toNumber(),
    },
    operationsRegistry: {
      address: system.operationsRegistry.address,
      owner: operationsRegistryOwner,
      requiredDelay: 0,
    },
  }
}

async function showOwners(network: string, ethers: any) {
  const system = await getSystem(network, ethers)
  if (!system) {
    return
  }

  const systemOwnership = await getSystemOwnership(system)
  if (!systemOwnership) {
    return
  }

  printOwnership(systemOwnership, network)
}

async function getPendingChangeInfo(
  system: System,
  newOwnerAddress: string,
  ethers: any,
): Promise<PendingChange> {
  const msgData = system.serviceRegistry.interface.encodeFunctionData('transferOwnership', [
    newOwnerAddress,
  ])
  const msgHash = ethers.utils.keccak256(msgData)

  const requiredDelayBN = await system.serviceRegistry.requiredDelay()
  const executionTimestampBN = await system.serviceRegistry.lastExecuted(msgHash)

  const now = (await ethers.provider.getBlock('latest')).timestamp

  const requiredDelay = requiredDelayBN.toNumber()
  const requestTimestamp = executionTimestampBN.toNumber()

  const isPending = requestTimestamp != 0
  const remainingTime = requestTimestamp + requiredDelay - now

  return {
    serviceRegistry: {
      isPending,
      waitingTimeSecs: remainingTime < 0 ? 0 : remainingTime,
    },
  }
}

async function changeOwners(newOwnerAddress: string, network: string, ethers: any) {
  const signer = (await ethers.getSigners())[0]

  if (isInvalidAddress(newOwnerAddress)) {
    throw new Error(`Invalid address for new owner: ${newOwnerAddress}`)
  }

  const system = await getSystem(network, ethers, signer)
  if (!system) {
    return
  }

  const systemOwnership = await getSystemOwnership(system)
  if (!systemOwnership) {
    return
  }

  const isServiceRegistryChangeNeeded = systemOwnership.serviceRegistry.owner !== newOwnerAddress
  const isOperationsRegistryChangeNeeded =
    systemOwnership.operationsRegistry.owner !== newOwnerAddress

  if (!isServiceRegistryChangeNeeded) {
    console.log(`The new owner address is already the owner of the ServiceRegistry`)
  }
  if (!isOperationsRegistryChangeNeeded) {
    console.log(`The new owner address is already the owner of the OperationsRegistry`)
  }

  if (!isServiceRegistryChangeNeeded && !isOperationsRegistryChangeNeeded) {
    console.log('No changes needed')
    return
  }

  console.log('\n============================')
  console.log('====== CHANGING OWNER ======')
  console.log('============================\n')

  printOwnership(systemOwnership, network, 'CURRENT CONFIG')

  console.log(`======= NEW OWNER DATA =======`)
  console.log(`Signer address: ${signer.address}`)
  console.log(`New owner address: ${newOwnerAddress}`)
  console.log('==============================\n')

  console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
  console.log(`!!!!!!!!!        WARNING: THIS IS A DANGEROUS OPERATION          !!!!!!!!!`)
  console.log(`!!!!!!!!! TAKE YOUR TIME TO VERIFY THAT THE NEW OWNER IS CORRECT !!!!!!!!!`)
  console.log(`!!!!!!!!! OTHERWISE THE CONTRACTS OWNERSHIP WILL BE LOST FOREVER !!!!!!!!!`)
  console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`)
  const answer = await input({
    message: `Check the config above first. You are about to change the owner to ${newOwnerAddress}'. Do you want to continue? (yes/NO)`,
  })

  if (answer === 'y' || answer === 'Y') {
    console.log(
      "Please write 'yes' with all the letters to confirm the operation...aborting now...",
    )
    return
  } else if (answer !== 'yes') {
    console.log('Aborting now...')
    return
  }

  console.log(`Changing owners to new address ${newOwnerAddress}...`)

  const pendingChange = await getPendingChangeInfo(system, newOwnerAddress, ethers)
  if (
    pendingChange.serviceRegistry.isPending &&
    pendingChange.serviceRegistry.waitingTimeSecs > 0
  ) {
    console.log(
      `There is a pending change for the ServiceRegistry. Please wait ${pendingChange.serviceRegistry.waitingTimeSecs} seconds before trying again.`,
    )
    return
  }

  // Push changes
  try {
    if (isServiceRegistryChangeNeeded) {
      console.log(`  - Transferring ownership of the ServiceRegistry to ${newOwnerAddress}...`)
      const tx = await system.serviceRegistry.transferOwnership(newOwnerAddress)
      await tx.wait()
    }

    if (isOperationsRegistryChangeNeeded) {
      console.log(`  - Transferring ownership of the OperationsRegistry to ${newOwnerAddress}...`)
      const tx = await system.operationsRegistry.transferOwnership(newOwnerAddress)
      await tx.wait()
    }
  } catch (e) {
    if (JSON.stringify(e).includes('registry/only-owner')) {
      console.log(
        `\nERROR: Only the previous owner can change the ownership of the contracts...aborting now`,
      )
    }
    return
  }

  console.log('')

  // Verify changes
  if (
    !pendingChange.serviceRegistry.isPending &&
    systemOwnership.serviceRegistry.requiredDelay > 0
  ) {
    console.log(
      `* System Registry change submitted, please wait ${systemOwnership.serviceRegistry.requiredDelay} seconds before executing it again...`,
    )
  } else {
    const owner = await system.serviceRegistry.owner()

    if (owner === newOwnerAddress) {
      console.log('* ServiceRegistry owner changed successfully!')
    }
  }

  const owner = await system.operationsRegistry.owner()

  if (owner === newOwnerAddress) {
    console.log('* OperationsRegistry owner changed successfully!')
  }
}

task(
  'ownership-tool',
  'Retrieves or pushes the owner address for the System and Operations registry',
)
  .addParam('getowners', 'Gets the owner address for the System and Operations registry', 'dummy')
  .addOptionalParam(
    'changeowners',
    'Changes the owner address for the System and Operations registry. Must be called by the current owner',
    undefined,
    types.string,
  )
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    if (taskArgs.changeowners) {
      await changeOwners(taskArgs.changeowners, network, ethers)
    } else if (taskArgs.getowners) {
      await showOwners(network, ethers)
    } else {
      throw new Error('Either --getowners, or --changeowner must be specified')
    }
  })
