import { getConfigByNetwork } from '@deploy-configurations/configs'
import { OPERATION_NAMES } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry } from '@typechain/index'
import { task } from 'hardhat/config'

import {
  ActionDefinition,
  ActionsDatabase,
  getOperationRegistry,
  getPropertyFromPath,
  OperationDefinition,
  OperationRegistryMaybe,
  OperationsDatabase,
  validateOperation,
} from '../common'
import { OperationValidationResult, OpValidationResultType } from '../common/verification-utils'

function showLocalConfig(configPath: string, network: string) {
  const config = OPERATION_NAMES

  const property = configPath === 'all' ? config : getPropertyFromPath(config, configPath)

  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== LOCAL CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log('==============================\n')
  console.log(property)
  console.log('\n==============================\n')
}

async function validateOperationWithLog(
  operationName: string,
  operationRegistry: OperationsRegistry,
  operationsDatabase: OperationsDatabase,
  actionsDatabase: ActionsDatabase,
  skipNotConfigured = false,
): Promise<OperationValidationResult> {
  const validationResult: OperationValidationResult = await validateOperation(
    operationName,
    operationRegistry,
    operationsDatabase,
    actionsDatabase,
  )

  switch (validationResult.type) {
    case OpValidationResultType.CONFIGURED:
      console.log(`[✅][ CONFIGURED ] ${operationName}`)
      break
    case OpValidationResultType.ACTION_MISMATCH:
      console.log(`[❌][ MISMATCHED ] ${operationName}: ${validationResult.error}`)
      break
    case OpValidationResultType.OP_UNKNOWN:
      console.log(`[❌][ UNDEFINED ]  ${operationName} is not defined in the local config`)
      break
    case OpValidationResultType.CONTRACT_ERROR:
      console.log(`[❌][FETCH ERROR]  ${operationName}: ${validationResult.error}`)
      break
    case OpValidationResultType.NOT_CONFIGURED:
      if (!skipNotConfigured) {
        console.log(`[❌][UNCONFIGURED] ${operationName}`)
      }
      break
  }

  return validationResult
}

async function showRemoteConfig(configPath: string, network: string, ethers: any) {
  const actionsDatabase: ActionsDatabase = new ActionsDatabase(network as Network)
  const operationsDatabase: OperationsDatabase = new OperationsDatabase(network as Network)
  const systemConfig: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig
  const config = OPERATION_NAMES

  const operationRegistry: OperationRegistryMaybe = await getOperationRegistry(
    ethers.provider,
    systemConfig,
  )
  if (!operationRegistry) {
    console.log('OperationRegistry not deployed, cannot fetch values')
    return
  }

  const property = getPropertyFromPath(config, configPath)
  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== REMOTE CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log(`OperationsRegistry: ${operationRegistry.address}`)
  console.log('==============================\n')

  for (const operation of Object.keys(property)) {
    const operationName: string = property[operation]
    await validateOperationWithLog(
      operationName,
      operationRegistry,
      operationsDatabase,
      actionsDatabase,
    )
  }

  console.log('\n==============================\n')
}

async function pushConfigToRemote(configPath: string, network: string, ethers: any) {
  const signer = (await ethers.getSigners())[0]
  const actionsDatabase: ActionsDatabase = new ActionsDatabase(network as Network)
  const operationsDatabase: OperationsDatabase = new OperationsDatabase(network as Network)
  const systemConfig: SystemConfig = getConfigByNetwork(network as Network) as SystemConfig
  const config = OPERATION_NAMES

  const operationRegistry: OperationRegistryMaybe = await getOperationRegistry(signer, systemConfig)
  if (!operationRegistry) {
    console.log('OperationRegistry not deployed, cannot fetch values')
    return
  }

  const property = getPropertyFromPath(config, configPath)
  if (!property) {
    throw new Error(`Property ${configPath} not found`)
  }

  console.log('\n====== ADDING CONFIG ======')
  console.log(`Network: ${network}`)
  console.log(`Path: ${configPath}`)
  console.log(`OperationsRegistry: ${operationRegistry.address}`)
  console.log('==============================\n')

  for (const operation of Object.keys(property)) {
    const operationName: string = property[operation]

    const validationResult = await validateOperationWithLog(
      operationName,
      operationRegistry,
      operationsDatabase,
      actionsDatabase,
      true,
    )

    if (validationResult.type === OpValidationResultType.NOT_CONFIGURED) {
      const operationDefinition: OperationDefinition | undefined =
        operationsDatabase.getDefinition(operationName)
      if (!operationDefinition) {
        console.log(`[❌][ UNDEFINED ] ${operationName} is not defined in the local config`)
        continue
      }

      const operationHashes: string[] = operationDefinition.actions.map(
        (action: ActionDefinition) => action.hash,
      )
      const operationOptionals: boolean[] = operationDefinition.actions.map(
        (action: ActionDefinition) => action.optional,
      )

      const tx = await operationRegistry.addOperation({
        name: operationName,
        actions: operationHashes,
        optional: operationOptionals,
      })
      await tx.wait()

      // Re-validate after adding it
      await validateOperationWithLog(
        operationName,
        operationRegistry,
        operationsDatabase,
        actionsDatabase,
      )
    }
  }

  console.log('\n==============================\n')
}

task('operations-registry', 'Allows to interact with the OperationsRegistry')
  .addOptionalParam(
    'pushconfig',
    "Pushes the values of the given property path in the local config for the given network to the SystemRegistry  (i.e. property path='aave.v3')",
  )
  .addOptionalParam(
    'showlocal',
    "Shows the given property path of the local config for the selected network (i.e. property path='aave.v3')",
  )
  .addOptionalParam(
    'showremote',
    "Shows the values of the OperationsRegistry for the given property path in the local config for the given network (i.e. property path='aave.v3')",
  )
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    if (taskArgs.pushconfig) {
      await pushConfigToRemote(taskArgs.pushconfig, network, ethers)
    } else if (taskArgs.showlocal) {
      showLocalConfig(taskArgs.showlocal, network)
    } else if (taskArgs.showremote) {
      await showRemoteConfig(taskArgs.showremote, network, ethers)
    } else {
      throw new Error('Either --pushconfig, --showlocal or --showremote must be specified')
    }
  })
