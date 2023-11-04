import { Network } from '@deploy-configurations/types/network'

import { SystemDatabase } from '../common/system-utils'
import { SupportedTxDecoders } from './config'
import { registerOperationRegistryDecoder } from './operation-registry.decoder'
import { ContractExecution, DecodingResult } from './types'

export function registerDecoders() {
  registerOperationRegistryDecoder()
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

    return decoderInfo?.decoder(network, execution, decoderInfo.supportedMethods)
  })
}
