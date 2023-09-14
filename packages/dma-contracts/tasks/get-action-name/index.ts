import { Network } from '@deploy-configurations/types/network'
import { task } from 'hardhat/config'

import { ActionsDatabase } from '../common'

task('get-action-name', 'Resolves the action name for a hash')
  .addParam('hash', 'Hash of the action to resolve')
  .setAction(async (params: any, hre) => {
    const { name: network } = hre.network

    const actionsDatabase: ActionsDatabase = new ActionsDatabase(network as Network)

    const actionName = actionsDatabase.getActionName(params.hash)

    if (!actionName) {
      console.log(`-> No action found for hash ${params.hash}`)
      return
    }

    console.log(`-> Action name for hash ${params.hash} is ${actionName}`)
  })
