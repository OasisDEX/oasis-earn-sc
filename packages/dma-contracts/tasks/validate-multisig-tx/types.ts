import { Network } from '@deploy-configurations/types/network'
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'

export type Filter = {
  name: string
  value: string | number
}

export type ContractParameter = {
  name: string
  type: string
  value: any
  decodedValue?: any
}
export type ContractParameterMaybe = ContractParameter | undefined

export type ContractAddress = {
  address: string
  name?: string
}

export type ContractExecution = {
  to: ContractAddress
  value: string
  method: string
  signature: string
  parameters: ContractParameter[]
  calldata?: string
  rawTx: SafeMultisigTransactionResponse
}

export type SafeTransaction = {
  rawTx: SafeMultisigTransactionResponse
  executionData: ContractExecution[]
}

// Decoders
export type DecodersMap = {
  [entryPath: string]: {
    decoder: TxDecoder
    supportedMethods: string[]
  }
}

export type DecodingResult = {
  executionData: ContractExecution
  isCalldataValid: boolean
  decodingMsg?: string
}

export type TxDecoder = (
  network: Network,
  executionData: ContractExecution,
  supportedMethods: string[],
) => DecodingResult
