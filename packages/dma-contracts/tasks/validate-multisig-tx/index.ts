import { Network } from '@deploy-configurations/types/network'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { decodeExecutionData, registerDecoders } from './decoders'
import { getSafeTransaction } from './safe-utils'
import { Filter } from './types'

//  SAFE_ADDRESS: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',

async function validateTransaction(
  hre: HardhatRuntimeEnvironment,
  multisigAddress: string,
  filter: Filter,
) {
  const { network } = hre

  registerDecoders()

  const safeTransaction = await getSafeTransaction(hre, multisigAddress, filter)
  const decodedExecutionData = decodeExecutionData(
    network.name as Network,
    safeTransaction.executionData,
  )

  const results = decodedExecutionData.map(result => result.decodingMsg)

  // console.log(`Decoding Result: ${JSON.stringify(decodedExecutionData, null, 2)}`)
  console.log(`Decoding Result: ${JSON.stringify(results, null, 2)}`)
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
