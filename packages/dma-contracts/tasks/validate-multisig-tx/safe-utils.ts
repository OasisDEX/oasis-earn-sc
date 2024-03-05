import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { EthAdapter, SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { DecodedCalldata, tryDecodeCallData as _tryDecodeCallData } from '../common/decodedCalldata'
import { OperationsDatabase } from '../common/operations-utils'
import { SystemDatabase } from '../common/system-utils'
import { SafeApiEndpoints } from './config'
import { ContractExecution, ContractParameter, Filter, SafeTransaction } from './types'

async function getRawTransaction(
  hre: HardhatRuntimeEnvironment,
  multisigAddress: string,
  filter: Filter,
): Promise<SafeMultisigTransactionResponse> {
  const { ethers, network } = hre
  const provider = ethers.provider

  const txServiceUrl = SafeApiEndpoints[network.name]

  if (!txServiceUrl) {
    throw new Error(
      `Network '${network.name}' is not supported. Please use one of ${Object.keys(
        SafeApiEndpoints,
      ).join(', ')}`,
    )
  }

  // Create EthAdapter instance
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: provider,
  })

  // Create Safe API Kit instance
  const safeService = new SafeApiKit({
    txServiceUrl,
    ethAdapter: ethAdapter as unknown as EthAdapter,
  })

  const pendingTransactions = await safeService.getMultisigTransactions(multisigAddress)
  if (!pendingTransactions) {
    throw new Error(`Unknown error fetching transactions for ${multisigAddress}`)
  }

  const tx = pendingTransactions.results.filter(tx => tx[filter.name] === filter.value)
  if (tx.length == 0) {
    throw new Error(`No transaction found for ${filter.name} = ${filter.value}`)
  }
  if (tx.length > 1) {
    throw new Error(`More than one transaction found for ${filter.name} = ${filter.value}`)
  }

  return tx[0]
}

function parseDataDecoded(dataDecoded: any): {
  signature: string
  parameters: ContractParameter[]
} {
  const method = dataDecoded.method

  console.log('dataDecoded', JSON.stringify(dataDecoded, null, 2))
  const parameters: ContractParameter[] = dataDecoded.parameters.map(parameter => {
    const { name, type, value } = parameter
    return {
      name,
      type,
      value,
    }
  })

  const signature = parameters.reduce((acc: string, parameter: ContractParameter) => {
    return acc + `${parameter.type} ${parameter.name}, `
  }, `${method}(`)

  return {
    signature: signature.slice(0, -2) + ')',
    parameters,
  }
}

function parseTransaction(tx: SafeMultisigTransactionResponse): ContractExecution[] {
  const dataDecoded = (tx.dataDecoded as any) ?? tryDecodeCallData(tx.data)
  if (!dataDecoded) {
    throw new Error('Multisig transaction contains no decoded calldata')
  }

  if (!dataDecoded.method) {
    throw new Error('Multisig transaction contains no method')
  }

  if (dataDecoded.method === 'multiSend') {
    return dataDecoded.parameters[0].valueDecoded.map((execution: any) => {
      const dataDecoded = execution.dataDecoded ?? tryDecodeCallData(execution.data)
      if (!dataDecoded) {
        throw new Error('Multisig transaction contains no decoded calldata')
      }

      const { parameters, signature } = parseDataDecoded(dataDecoded)

      return {
        to: {
          address: execution.to,
        },
        value: execution.value,
        method: dataDecoded.method,
        signature: signature,
        parameters: parameters,
        calldata: execution.data,
      }
    })
  } else {
    const { parameters, signature } = parseDataDecoded(dataDecoded)

    return [
      {
        to: {
          address: tx.to,
        },
        value: tx.value,
        method: dataDecoded.method,
        signature: signature,
        parameters: parameters,
        calldata: tx.data,
        rawTx: tx,
      },
    ]
  }
}

export async function getSafeTransaction(
  hre: HardhatRuntimeEnvironment,
  multisigAddress: string,
  filter: Filter,
): Promise<SafeTransaction> {
  const rawTx = await getRawTransaction(hre, multisigAddress, filter)

  //console.log('rawTx', JSON.stringify(rawTx, null, 2))

  const executionData = parseTransaction(rawTx)

  return {
    rawTx,
    executionData,
  }
}

function tryDecodeCallData(calldata?: string): DecodedCalldata | undefined {
  if (!calldata) {
    return undefined
  }
  const systemAddService = SystemDatabase.functions['addNamedService']
  const systemDecodedData = _tryDecodeCallData(systemAddService, calldata)
  if (systemDecodedData) {
    return systemDecodedData
  }

  const operationsAddOperation = OperationsDatabase.functions['addOperation']
  return _tryDecodeCallData(operationsAddOperation, calldata)
}
