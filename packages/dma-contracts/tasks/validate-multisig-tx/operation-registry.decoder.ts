import { Network } from '@deploy-configurations/types/network'
import { green, red } from 'console-log-colors'

import { ActionsDatabase, OperationsDatabase } from '../common'
import { SupportedTxDecoders } from './config'
import {
  ContractExecution,
  ContractParameter,
  ContractParameterMaybe,
  DecodingResult,
  DecodingResultType,
} from './types'

export type AddOperationDecodedParam = {
  actions: string[]
  optionals: string[]
  operationName: string
}

const OperationRegistryDecoderDefinition = {
  decoder: decodeOperationRegistryTx,
  printer: printDecodedOperation,
  supportedMethods: ['addOperation'],
}

export function printDecodedAddOperation(decodingResult: DecodingResult) {
  if (!decodingResult.executionData.parameters[0].decodedValue) {
    console.log(`Operation nof fully decoded, some unknown error occurred`)
    return
  }

  const decodedValue = decodingResult.executionData.parameters[0]
    .decodedValue as AddOperationDecodedParam

  console.log(`\n========== OPERATION DEFINITION ============`)
  console.log(`Contract: ${decodingResult.executionData.to.name}`)
  console.log(`Address: ${decodingResult.executionData.to.address}`)
  console.log(`Operation: ${decodedValue.operationName}`)
  console.log(`----------------------------------------------`)
  console.log(
    ` [Optional]  [Hash]                                                                [Name]`,
  )

  decodedValue.actions.forEach((actionName, index) => {
    const actionHash = decodingResult.executionData.parameters[0].value[0][index]
    const optional = decodedValue.optionals[index]
    console.log(
      `  ${optional === 'True' ? 'True ' : 'False'}       ${actionHash}    ${
        actionName === '(Unknown)' ? '❌' : '✅'
      } ${actionName} `,
    )
  })

  console.log(`=======================================`)

  if (decodingResult.decodingResultType === DecodingResultType.Error) {
    console.log(red(`\n[ERROR REASON]: ${decodingResult.decodingMsg}`))
    console.log(`\nThe Operation could not be fully decoded due to the reason above`)
    console.log(
      `This does not mean that the transaction is invalid. However, manual validation is required to ensure that the transaction is valid.`,
    )

    return
  }

  console.log(green(`\n[SUCCESS] Operation ${decodedValue.operationName} validated successfully!!`))
}

export function printDecodedOperation(decodingResult: DecodingResult) {
  switch (decodingResult.executionData.method) {
    case 'addOperation':
      printDecodedAddOperation(decodingResult)
      break
    default:
      console.log(
        `Operation Registry method ${decodingResult.executionData.method} not supported for decoding`,
      )
  }
}

export function decodeAddOperationParameter(
  network: Network,
  parameter: ContractParameter,
): ContractParameterMaybe {
  const actionsDatabase = new ActionsDatabase(network)
  const actionHashes = parameter.value[0] as string[]
  const optionals = parameter.value[1] as string[]

  const actions = actionHashes.map(actionHash => {
    const actionName = actionsDatabase.getActionName(actionHash)
    return actionName ? actionName : '(Unknown)'
  })

  return {
    ...parameter,
    decodedValue: {
      actions: actions,
      optionals: optionals,
      operationName: parameter.value[2],
    } as AddOperationDecodedParam,
  }
}

export function decodeOperationRegistryTx(
  network: Network,
  executionData: ContractExecution,
): DecodingResult {
  if (!OperationRegistryDecoderDefinition.supportedMethods.includes(executionData.method)) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Method not supported',
    }
  }

  const operationsDatabase: OperationsDatabase = new OperationsDatabase(network)

  // Only 'addOperation' is supported
  const decodedParameter = decodeAddOperationParameter(network, executionData.parameters[0])
  if (!decodedParameter) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Error decoding parameter',
    }
  }

  executionData.parameters[0] = decodedParameter

  if (!executionData.calldata) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Calldata not present',
    }
  }

  const operationDefinition = operationsDatabase.findByCallData(executionData.calldata)
  if (!operationDefinition) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Operation definition not found in the current branch',
    }
  }

  if (operationDefinition.name !== executionData.parameters[0].value[2]) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
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
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Operation hashes do not match with the definition',
    }
  }

  return {
    executionData,
    decodingResultType: DecodingResultType.Success,
    decodingMsg: 'Operation validated successfully',
  }
}

export function registerOperationRegistryDecoder() {
  SupportedTxDecoders['mpa.core.OperationsRegistry'] = OperationRegistryDecoderDefinition
}
