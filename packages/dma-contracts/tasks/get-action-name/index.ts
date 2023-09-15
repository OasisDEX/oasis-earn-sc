import { Network } from '@deploy-configurations/types/network'
import { task } from 'hardhat/config'

import { ActionsDatabase } from '../common'

task('get-action-name', 'Resolves the action name for a hash')
  .addParam('hash', 'Hash of the action to resolve')
  .setAction(async (params: any, hre) => {
    const { name: hreNetwork } = hre.network

    const network = hreNetwork === 'hardhat' ? Network.MAINNET : (hreNetwork as Network)

    console.log(`========================================`)
    console.log(`Network: ${network}`)
    console.log(`========================================\n`)

    const actionsDatabase: ActionsDatabase = new ActionsDatabase(network as Network)

    const actionName = actionsDatabase.getActionName(params.hash)

    if (!actionName) {
      console.log(`ERROR: No action found for hash ${params.hash}`)
      return
    }

    console.log(`Hash: ${params.hash}`)
    console.log(`Name: ${actionName}`)
    console.log(`\n========================================\n`)
  })
