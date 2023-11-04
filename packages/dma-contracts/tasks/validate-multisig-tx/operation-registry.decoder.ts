import { Network } from '@deploy-configurations/types/network'

import { ActionsDatabase, OperationsDatabase } from '../common'
import { SupportedTxDecoders } from './config'
import {
  ContractExecution,
  ContractParameter,
  ContractParameterMaybe,
  DecodingResult,
} from './types'

// function validateOperationRegistryTx(network: Network, tx: SafeMultisigTransactionResponse) {
//   if (!tx.data) {
//     throw new Error('Multisig transaction contains no calldata')
//   }

//   const operationsDatabase: OperationsDatabase = new OperationsDatabase(network)
//   const actionsDatabase = new ActionsDatabase(network)

//   const operationDefinition = operationsDatabase.findByCallData(tx.data)
//   if (!operationDefinition) {
//     throw new Error(
//       'Multisig transaction does not match with any known operations in the current branch',
//     )
//   }

//   const actionsNames = operationDefinition.actions.map(action =>
//     actionsDatabase.getActionName(action.hash),
//   )

//   console.log(`\n============ OPERATION FOUND ============`)
//   console.log(`Contract: OperationRegistry`)
//   console.log(`Operation: ${operationDefinition.name}`)
//   console.log(`\n========== OPERATION DEFINITION ============`)
//   console.log(
//     ` [Optional]  [Hash]                                                                [Name]`,
//   )
//   operationDefinition.actions.forEach((action, index) => {
//     console.log(
//       `  ${action.optional ? 'True      ' : 'False     '}  ${action.hash}    ${
//         actionsNames[index]
//       }`,
//     )
//   })
//   console.log(`=======================================`)

//   console.log(`\nOperation validated successfully!!`)
// }

export function decodeAddOperationParameter(
  network: Network,
  parameter: ContractParameter,
): ContractParameterMaybe {
  const actionsDatabase = new ActionsDatabase(network)
  const actionHashes = parameter.value[0] as string[]

  const actions = actionHashes.map(actionHash => actionsDatabase.getActionName(actionHash))
  if (actions.includes(undefined)) {
    return undefined
  }

  return {
    ...parameter,
    decodedValue: {
      actions: actions,
      skip: parameter.value[1],
      operationName: parameter.value[2],
    },
  }
}

export function decodeOperationRegistryTx(
  network: Network,
  executionData: ContractExecution,
  supportedMethods: string[],
): DecodingResult {
  if (!supportedMethods.includes(executionData.method)) {
    return {
      executionData,
      isCalldataValid: false,
      decodingMsg: 'Method not supported',
    }
  }

  const operationsDatabase: OperationsDatabase = new OperationsDatabase(network)

  // Only 'addOperation' is supported
  executionData.parameters[0].decodedValue = decodeAddOperationParameter(
    network,
    executionData.parameters[0],
  )

  if (!executionData.calldata) {
    return {
      executionData,
      isCalldataValid: false,
      decodingMsg: 'Calldata not present',
    }
  }

  const operationDefinition = operationsDatabase.findByCallData(executionData.calldata)
  if (!operationDefinition) {
    return {
      executionData,
      isCalldataValid: false,
      decodingMsg: 'Operation definition not found in the current branch',
    }
  }

  if (operationDefinition.name !== executionData.parameters[0].value[2]) {
    return {
      executionData,
      isCalldataValid: true,
      decodingMsg: 'Operation name does not match with the definition',
    }
  }

  const operationDefinitionHashes = operationDefinition.actions.map(action => action.hash)

  if (
    JSON.stringify(operationDefinitionHashes) !==
    JSON.stringify(executionData.parameters[0].value[0])
  ) {
    return {
      executionData,
      isCalldataValid: true,
      decodingMsg: 'Operation hashes do not match with the definition',
    }
  }

  return {
    executionData,
    isCalldataValid: true,
    decodingMsg: 'Operation validated successfully',
  }
}

export function registerOperationRegistryDecoder() {
  SupportedTxDecoders['mpa.core.OperationsRegistry'] = {
    decoder: decodeOperationRegistryTx,
    supportedMethods: ['addOperation'],
    //'mpa.core.ServiceRegistry'
    // 'mpa.core.Swap'
  }
}
