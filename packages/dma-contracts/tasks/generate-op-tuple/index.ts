import { Network } from '@deploy-configurations/types/network'
import { task } from 'hardhat/config'
import { utils } from 'ethers'

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

function generateOperationTuple(
  taskArgs: any,
  network: Network,
  operationsDatabase: OperationsDatabase,
) {
  console.log('======================================================================')
  console.log(`Generating tuple for operation ${taskArgs.op} (hash: ${utils.formatBytes32String(taskArgs.op)}) on network '${network}'`)
  console.log('======================================================================\n')

  const operationTuple: string | undefined = operationsDatabase.getTuple(taskArgs.op)

  if (!operationTuple) {
    throw new Error(`Operation ${taskArgs.op} not found`)
  }

  console.log(operationTuple)
  console.log('\n======================================================================\n')
}

task('gen-op-tuple', 'Generates calldata for adding an operation to the OperationRegistry')
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

    generateOperationTuple(taskArgs, network, operationsDatabase)
  })
