import { Network } from '@deploy-configurations/types/network'
import SafeApiKit from '@safe-global/api-kit'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { EthAdapter, SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { ActionsDatabase, OperationsDatabase } from '../common'
import { SystemDatabase } from '../common/system-utils'

const SafeApiEndpoints = {
  arbitrum: 'https://safe-transaction-arbitrum.safe.global/',
  aurora: 'https://safe-transaction-aurora.safe.global/',
  avalanche: 'https://safe-transaction-avalanche.safe.global/',
  base: 'https://safe-transaction-base.safe.global/',
  celo: 'https://safe-transaction-celo.safe.global/',
  mainnet: 'https://safe-transaction-mainnet.safe.global/',
  optimism: 'https://safe-transaction-optimism.safe.global/',
  polygon: 'https://safe-transaction-polygon.safe.global/',
}

type Filter = {
  name: string
  value: string | number
}

type ContractParameter = {
  name: string
  type: string
  value: string
  decodedValue?: string
}

type ContractAddress = {
  address: string
  name?: string
}

type ContractExecution = {
  to: ContractAddress
  value: string
  method: string
  signature: string
  parameters: ContractParameter[]
}

//  SAFE_ADDRESS: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
async function getTransaction(
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
  if (!tx.dataDecoded) {
    throw new Error('Multisig transaction contains no decoded calldata')
  }

  const dataDecoded = tx.dataDecoded as any
  if (!dataDecoded.method) {
    throw new Error('Multisig transaction contains no method')
  }

  if (dataDecoded.method === 'multiSend') {
    return dataDecoded.parameters[0].valueDecoded.map((execution: any) => {
      const { parameters, signature } = parseDataDecoded(execution.dataDecoded)
      return {
        to: {
          address: execution.to,
        },
        value: execution.value,
        method: execution.method,
        signature: signature,
        parameters: parameters,
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
      },
    ]
  }
}

function validateOperationRegistryTx(network: Network, tx: SafeMultisigTransactionResponse) {
  if (!tx.data) {
    throw new Error('Multisig transaction contains no calldata')
  }

  const operationsDatabase: OperationsDatabase = new OperationsDatabase(network)
  const actionsDatabase = new ActionsDatabase(network)

  const operationDefinition = operationsDatabase.findByCallData(tx.data)
  if (!operationDefinition) {
    throw new Error(
      'Multisig transaction does not match with any known operations in the current branch',
    )
  }

  const actionsNames = operationDefinition.actions.map(action =>
    actionsDatabase.getActionName(action.hash),
  )

  console.log(`\n============ OPERATION FOUND ============`)
  console.log(`Contract: OperationRegistry`)
  console.log(`Operation: ${operationDefinition.name}`)
  console.log(`\n========== OPERATION DEFINITION ============`)
  console.log(
    ` [Optional]  [Hash]                                                                [Name]`,
  )
  operationDefinition.actions.forEach((action, index) => {
    console.log(
      `  ${action.optional ? 'True      ' : 'False     '}  ${action.hash}    ${
        actionsNames[index]
      }`,
    )
  })
  console.log(`=======================================`)

  console.log(`\nOperation validated successfully!!`)
}

function validateServiceRegistryTx(tx: SafeMultisigTransactionResponse) {
  throw new Error('Function not implemented.')
}

function validateSwapTx(tx: SafeMultisigTransactionResponse) {
  throw new Error('Function not implemented.')
}

async function validateTransaction(
  hre: HardhatRuntimeEnvironment,
  multisigAddress: string,
  filter: Filter,
) {
  const { network } = hre

  const tx = await getTransaction(hre, multisigAddress, filter)
  //console.log(JSON.stringify(tx, null, 2))
  const executionData = parseTransaction(tx)
  console.log(`Execution Data: ${JSON.stringify(executionData, null, 2)}`)
  return

  const systemDatabase = new SystemDatabase(network.name as Network)

  const entry = systemDatabase.getEntryByAddress(tx.to)
  if (!entry) {
    throw new Error(`No system contract found for transaction 'to' address ${tx.to}`)
  }

  console.log(`=========== MULTISIG TRANSACTION ===========`)
  console.log(`Network: ${network.name}`)
  console.log(`Multisig: ${multisigAddress}`)
  console.log(`Nonce: ${tx.nonce}`)
  console.log(`Transaction Hash: ${tx.transactionHash}`)
  console.log(`Safe Hash: ${tx.safeTxHash}`)

  switch (entry.path) {
    case 'mpa.core.OperationsRegistry':
      validateOperationRegistryTx(network.name as Network, tx)
      break
    case 'mpa.core.ServiceRegistry':
      validateServiceRegistryTx(tx)
      break
    case 'mpa.core.Swap':
      validateSwapTx(tx)
      break
    default:
      throw new Error(`System contract ${entry.name} at config path ${entry.path} not supported`)
  }
}

task('validate-multisig-tx', 'Validates the given transaction for the given multisig address')
  .addParam('multisig', 'The address of the multisig to be used')
  .addOptionalParam('id', 'The ID (nonce) of the transaction to be validated')
  .addOptionalParam('txhash', 'The hash of the transaction to be validated')
  .addOptionalParam('safehash', 'The hash of the safe to be validated')
  .setAction(async (taskArgs, hre) => {
    const { multisig, id, txhash, safehash } = taskArgs

    if (!id && !txhash && !safehash) {
      throw new Error('Please provide a transaction ID, hash or safe hash')
    }
    if ([id, txhash, safehash].filter(x => !!x).length > 1) {
      throw new Error('Please provide only one of transaction ID, hash or safe hash')
    }

    const filter = id
      ? { name: 'nonce', value: parseInt(id) }
      : txhash
      ? { name: 'transactionHash', value: txhash }
      : { name: 'safeTxHash', value: safehash }

    await validateTransaction(hre, multisig, filter)
  })
