import { getRefinanceOperationDefinition, getRefinanceOperationName, Network } from '@dma-library'
import { isProtocol, Protocol, ProtocolNames } from '@dma-library/types'
import { task } from 'hardhat/config'

function getOperationDefinition(network: Network, fromProtocol: Protocol, toProtocol: Protocol) {
  if (!isProtocol(fromProtocol) || !isProtocol(toProtocol)) {
    console.log('Invalid protocol, please use one of the following: ', ProtocolNames)
    return
  }
  const operationName = getRefinanceOperationName(fromProtocol, toProtocol)

  console.log('==============================')
  console.log('Operation: ', operationName)
  console.log('==============================')

  const operationDefinition = getRefinanceOperationDefinition(network, fromProtocol, toProtocol)
  if (!operationDefinition) {
    console.log('No definition found!')
    return
  }

  console.log('Name: ', operationDefinition.name)
  console.log('Actions: ', JSON.stringify(operationDefinition.actions, null, 2))
}

task('refinance-get-definition', 'Gets the definition of a refinance operation')
  .addParam('fromProtocol', 'The protocol that the refinance is closing from')
  .addParam('toProtocol', 'The protocol that the refinance is opening to')
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    getOperationDefinition(network as Network, taskArgs.fromProtocol, taskArgs.toProtocol)
  })
