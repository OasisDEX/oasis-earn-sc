import { Network } from '@deploy-configurations/types/network'
import { task } from 'hardhat/config'

import { OperationsDatabase } from '../common'

function listOperations(network: Network, operationsDatabase: OperationsDatabase) {
  console.log('\n====== LIST OF OPERATIONS ======')
  console.log(`Network: ${network}`)
  console.log('================================\n')

  const operationNames: string[] = operationsDatabase.getOperationNames()

  operationNames.forEach(operationName => {
    console.log(operationName)
  })

  console.log('\n================================\n')
}

function generateOperationHash(
  taskArgs: any,
  network: Network,
  operationsDatabase: OperationsDatabase,
) {
  console.log('======================================================================')
  console.log(`Generating hash for operation ${taskArgs.op} on network '${network}'`)
  console.log('======================================================================\n')

  const operationHash: string | undefined = operationsDatabase.getOpHash(taskArgs.op)

  if (!operationHash) {
    throw new Error(`Operation ${taskArgs.op} not found`)
  }

  console.log('Hash of action hashes')
  console.log(operationHash)
  console.log('\n======================================================================\n')
}

task('gen-op-hash', 'Generates operation hash for adding an operation to the OperationRegistry')
  .addOptionalParam<string>('op', 'The name of the operation to generate calldata for')
  .addFlag('list', 'List all available operations')
  .setAction(async (taskArgs, hre) => {
    const { name: hreNetwork } = hre.network

    const network = hreNetwork === 'hardhat' ? Network.MAINNET : (hreNetwork as Network)

    const operationsDatabase: OperationsDatabase = new OperationsDatabase(network)
    if (!taskArgs.list && !taskArgs.op) {
      throw new Error('Either --list or --op must be specified')
    }

    if (taskArgs.list) {
      listOperations(network, operationsDatabase)
      return
    }

    generateOperationHash(taskArgs, network, operationsDatabase)
  })
