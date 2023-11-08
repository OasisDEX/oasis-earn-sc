import { Network } from '@deploy-configurations/types/network'
import { green, red } from 'console-log-colors'

import { SystemDatabase } from '../common/system-utils'
import { SupportedTxDecoders } from './config'
import {
  ContractAddress,
  ContractExecution,
  ContractParameter,
  ContractParameterMaybe,
  DecodingResult,
  DecodingResultType,
} from './types'

export type AddNamedServiceDecodedParam = {
  hash: string
  service: ContractAddress
}

const ServiceRegistryDecoderDefinition = {
  decoder: decodeServiceRegistryTx,
  printer: printDecodedOperation,
  supportedMethods: ['addNamedService'],
}

export function printDecodedAddNamedService(decodingResult: DecodingResult) {
  const decodedServiceName = decodingResult.executionData.parameters[0].decodedValue
  const decodedContractName = decodingResult.executionData.parameters[1].decodedValue

  console.log(`\n========== SERVICE ADDITION ============`)
  console.log(
    `TX Target:       ${decodingResult.executionData.to.name} (${decodingResult.executionData.to.address})`,
  )
  console.log(
    `Service Name:    ${
      decodedServiceName ? `${green(decodedServiceName)}` : `${red('UNKNOWN')}`
    } (${decodingResult.executionData.parameters[0].value})`,
  )
  console.log(
    `Service Address: ${
      decodedContractName ? `${green(decodedContractName)}` : `${red('UNKNOWN')}`
    } (${decodingResult.executionData.parameters[1].value})`,
  )
  console.log(`=======================================`)

  if (decodingResult.decodingResultType === DecodingResultType.Error) {
    console.log(red(`\n[ERROR REASON]: ${decodingResult.decodingMsg}`))
    console.log(`\nThe Service addition could not be fully decoded due to the reason above.`)
    console.log(
      `This does not mean that the transaction is invalid. However, manual validation is required to ensure that the transaction is valid.`,
    )

    return
  }

  console.log(
    green(
      `\n[SUCCESS] Addition of service ${decodedServiceName || 'UNKNOWN'} with address ${
        decodingResult.executionData.parameters[1].value
      } validated successfully!!`,
    ),
  )
}

export function printDecodedOperation(decodingResult: DecodingResult) {
  switch (decodingResult.executionData.method) {
    case 'addNamedService':
      printDecodedAddNamedService(decodingResult)
      break
    default:
      console.log(
        `Service Registry method ${decodingResult.executionData.method} not supported for decoding`,
      )
  }
}

export function decodeAddNamedServiceParameters(
  network: Network,
  parameters: ContractParameter[],
): ContractParameterMaybe[] {
  const systemDatabase = new SystemDatabase(network)

  const serviceNameEntry = systemDatabase.getServiceNameEntryByHash(parameters[0].value)
  const systemEntry = systemDatabase.getEntryByAddress(parameters[1].value)

  return [
    {
      ...parameters[0],
      decodedValue: serviceNameEntry?.name,
    },
    {
      ...parameters[1],
      decodedValue: systemEntry?.name,
    },
  ]
}

export function decodeServiceRegistryTx(
  network: Network,
  executionData: ContractExecution,
): DecodingResult {
  if (!ServiceRegistryDecoderDefinition.supportedMethods.includes(executionData.method)) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Method not supported',
    }
  }

  // Only 'addNamedService' is supported
  const decodedParameters = decodeAddNamedServiceParameters(network, executionData.parameters)
  if (
    !decodedParameters ||
    decodedParameters.length !== 2 ||
    !decodedParameters[0] ||
    !decodedParameters[1]
  ) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Error decoding parameters',
    }
  }

  if (!decodedParameters[0].decodedValue || !decodedParameters[1].decodedValue) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Some parameters names could not be decoded',
    }
  }

  if (decodedParameters[0].decodedValue.isUsingKeyName) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: `Service name is using a config key name (${decodedParameters[0].decodedValue.name} instead of the actual value name`,
    }
  }

  executionData.parameters = decodedParameters as ContractParameter[]

  if (!executionData.calldata) {
    return {
      executionData,
      decodingResultType: DecodingResultType.Error,
      decodingMsg: 'Calldata not present',
    }
  }

  return {
    executionData,
    decodingResultType: DecodingResultType.Success,
    decodingMsg: 'Operation validated successfully',
  }
}

export function registerServiceRegistryDecoder() {
  SupportedTxDecoders['mpa.core.ServiceRegistry'] = ServiceRegistryDecoderDefinition
}
