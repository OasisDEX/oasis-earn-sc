import { getConfigByNetwork } from '@deploy-configurations/configs'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'
import { OperationsRegistry, ServiceRegistry } from '@typechain/index'
import { color } from 'console-log-colors'
import { task } from 'hardhat/config'
const { red, yellow, green } = color
import * as OperationGetters from '@deploy-configurations/operation-definitions'

import {
  ActionDefinition,
  ActionsDatabase,
  ActionValidationResult,
  getOperationRegistry,
  getServiceRegistry,
  isInvalidAddress,
  OperationDefinition,
  OperationDefinitionGetter,
  VerificationResult,
} from '../common'

function validateActionHashes(
  operationHashes: string[],
  operationOptionals: boolean[],
  actionDefinitions: ActionDefinition[],
): ActionValidationResult {
  let actionsValidated = true
  let actionsErrorMessage: string | undefined = undefined

  for (let actionIndex = 0; actionIndex < actionDefinitions.length; actionIndex++) {
    if (
      actionDefinitions[actionIndex].hash !== operationHashes[actionIndex] ||
      actionDefinitions[actionIndex].optional !== operationOptionals[actionIndex]
    ) {
      actionsValidated = false
      actionsErrorMessage = `Action ${actionIndex} hash mismatch: ${actionDefinitions[actionIndex].hash} !== ${operationHashes[actionIndex]}`
      break
    }
  }

  return {
    success: actionsValidated,
    errorMessage: actionsErrorMessage,
  }
}

async function validateDeployedActions(
  actionsDatabase: ActionsDatabase,
  serviceRegistry: ServiceRegistry,
  actionDefinitions: ActionDefinition[],
): Promise<ActionValidationResult> {
  const actionsNotDeployed: string[] = []

  for (let actionIndex = 0; actionIndex < actionDefinitions.length; actionIndex++) {
    const actionAddress = await serviceRegistry.getServiceAddress(
      actionDefinitions[actionIndex].hash,
    )

    if (isInvalidAddress(actionAddress)) {
      const actionName = actionsDatabase.getActionName(actionDefinitions[actionIndex].hash)
      actionsNotDeployed.push(actionName)
      break
    }
  }

  if (actionsNotDeployed.length > 0) {
    return {
      success: false,
      errorMessage: `missing actions: [${actionsNotDeployed.join(', ')}]`,
    }
  } else {
    return {
      success: true,
    }
  }
}

async function validateOperations(
  actionsDatabase: ActionsDatabase,
  serviceRegistry: ServiceRegistry,
  operationRegistry: OperationsRegistry,
  operationDefinitions: OperationDefinition[],
): Promise<VerificationResult> {
  let totalValidated = 0
  let totalEntries = 0

  for (const operationDefinition of operationDefinitions) {
    totalEntries++

    let operationHashes: string[]
    let operationOptionals: boolean[]
    try {
      ;[operationHashes, operationOptionals] = await operationRegistry.getOperation(
        operationDefinition.name,
      )
    } catch (e: any) {
      const deployedActionsResult: ActionValidationResult = await validateDeployedActions(
        actionsDatabase,
        serviceRegistry,
        operationDefinition.actions,
      )

      if (!deployedActionsResult.success) {
        console.log(
          `${operationDefinition.name}: ❌ (${
            JSON.stringify(e).includes("Operation doesn't exist")
              ? `not found in registry and ${deployedActionsResult.errorMessage}`
              : 'unknown error'
          })`,
        )
      } else {
        console.log(
          `${operationDefinition.name}: ❌ (not found in registry but all actions are deployed)`,
        )
      }
      continue
    }

    if (operationHashes.length === 0) {
      console.log(`${operationDefinition.name}: ❌ (not found in registry)`)
      continue
    }

    if (operationHashes.length !== operationDefinition.actions.length) {
      console.log(`${operationDefinition.name}: ❌ (mismatch in number of actions)`)
      continue
    }

    const actionValidationResult: ActionValidationResult = validateActionHashes(
      operationHashes,
      operationOptionals,
      operationDefinition.actions,
    )

    console.log(
      `${operationDefinition.name}: ${
        actionValidationResult.success ? '✅' : `❌ (${actionValidationResult.errorMessage}})`
      }`,
    )

    if (actionValidationResult.success) {
      totalValidated++
    }
  }

  return {
    success: totalValidated === totalEntries,
    totalEntries,
    totalValidated,
  }
}

function getValidationStatusString(verificationResult: VerificationResult): string {
  const verificationPercentage: number = Math.round(
    (verificationResult.totalValidated / verificationResult.totalEntries) * 100,
  )

  if (verificationPercentage < 30) {
    return red(
      `${verificationResult.totalValidated} out of ${verificationResult.totalEntries} operations verified successfully`,
    )
  } else if (verificationPercentage < 70) {
    return yellow(
      `${verificationResult.totalValidated} out of ${verificationResult.totalEntries} operations verified successfully`,
    )
  } else {
    return green(
      `${verificationResult.totalValidated} out of ${verificationResult.totalEntries} operations verified successfully`,
    )
  }
}

task('verify-operations', 'List the available operations for the current network').setAction(
  async (_: any, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    console.log('\n====== LIST OF OPERATIONS ======')
    console.log(`Network: ${network}`)
    console.log('================================\n')

    const actionsDatabase: ActionsDatabase = new ActionsDatabase(network as Network)

    const config: SystemConfig = getConfigByNetwork(network as Network)

    const serviceRegistry = await getServiceRegistry(ethers, config)
    if (!serviceRegistry) {
      console.log('ServiceRegistry not deployed, stopping verification')
      return
    }

    const operationRegistry = await getOperationRegistry(ethers, config)
    if (!operationRegistry) {
      console.log('OperationRegistry not deployed, stopping verification')
      return
    }

    const operationDefinitions: OperationDefinition[] = Object.keys(OperationGetters).map(key =>
      (OperationGetters as unknown as OperationDefinitionGetter[])[key](network),
    )

    const verificationResult: VerificationResult = await validateOperations(
      actionsDatabase,
      serviceRegistry,
      operationRegistry,
      operationDefinitions,
    )

    if (verificationResult.success) {
      console.log(green('\nAll operations verified successfully'))
    } else {
      console.log(`\n${getValidationStatusString(verificationResult)}`)
    }

    console.log('\nDone! ')
  },
)
