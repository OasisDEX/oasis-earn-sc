import { Network } from '@deploy-configurations/types/network'

import { SystemDatabase } from '../common/system-utils'
import { SupportedTxDecoders } from './config'
import { registerOperationRegistryDecoder } from './operation-registry.decoder'
import { registerServiceRegistryDecoder } from './service-registry.decoder'
import { ContractExecution, DecodingResult } from './types'

export function registerDecoders() {
  registerOperationRegistryDecoder()
  registerServiceRegistryDecoder()
}

export function decodeExecutionData(
  network: Network,
  executionData: ContractExecution[],
): DecodingResult[] {
  const systemDatabase = new SystemDatabase(network)

  return executionData.map(execution => {
    const entry = systemDatabase.getEntryByAddress(execution.to.address)

    execution.to.name = entry?.name

    const decoderInfo = SupportedTxDecoders[entry?.path || '']
    if (!decoderInfo) {
      return {
        executionData: execution,
        decodingResultType: 'Error',
        decodingMsg: `No decoder found for contract ${execution.to.address}`,
      } as DecodingResult
    }
    return decoderInfo?.decoder(network, execution)
  })
}

export function printDecodedResult(network: Network, decodingResult: DecodingResult): void {
  const systemDatabase = new SystemDatabase(network)

  const entry = systemDatabase.getEntryByAddress(decodingResult.executionData.to.address)

  const decoderInfo = SupportedTxDecoders[entry?.path || '']
  if (!decoderInfo) {
    console.log(
      `No decoder found for contract ${decodingResult.executionData.to.address} ${
        decodingResult.executionData.to.name
          ? `(${decodingResult.executionData.to.name})`
          : '(unknown contract)'
      }`,
    )
  }
  decoderInfo?.printer(decodingResult)
}
