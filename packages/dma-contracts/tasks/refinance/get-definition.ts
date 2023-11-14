import { loadContractNames } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash'
import { getRefinanceOperationDefinition, getRefinanceOperationName, Network } from '@dma-library'
import { isProtocol, Protocol, ProtocolNames } from '@dma-library/types'
import { OperationPathsDefinition } from '@dma-library/types/operations-definition'
import { task } from 'hardhat/config'

import { getPropertyFromPath } from '../common'

const DecodingModes = ['paths', 'full'] as const
type DecodingMode = (typeof DecodingModes)[number]
const isDecodingMode = (x: any): x is DecodingMode => DecodingModes.includes(x)

type ExtendedActionDefinition = {
  name: string
  serviceNamePath: string
  hash: string
  optional: boolean
}

type ExtendedOperationDefinition = {
  name: string
  actions: ExtendedActionDefinition[]
}

type ExtendedOperationDefinitionMaybe = ExtendedOperationDefinition | undefined

function decodeOperationDefinitionPaths(
  network: Network,
  operationDefinition: OperationPathsDefinition,
): ExtendedOperationDefinitionMaybe | undefined {
  const SERVICE_REGISTRY_NAMES = loadContractNames(network)

  const actionsDefinition = operationDefinition.actions.map(actionDefinition => {
    const actionName = getPropertyFromPath(
      SERVICE_REGISTRY_NAMES,
      actionDefinition.serviceNamePath,
    ) as string

    if (!actionName) {
      return undefined
    }

    const actionHash = getActionHash(actionName)

    return {
      name: actionName,
      serviceNamePath: actionDefinition.serviceNamePath,
      hash: actionHash,
      optional: actionDefinition.optional,
    }
  })

  if (actionsDefinition.includes(undefined)) {
    return undefined
  }

  return {
    name: operationDefinition.name,
    actions: actionsDefinition as ExtendedActionDefinition[],
  }
}

function getOperationDefinition(
  network: Network,
  fromProtocol: Protocol,
  toProtocol: Protocol,
  mode: DecodingMode,
) {
  if (!isProtocol(fromProtocol) || !isProtocol(toProtocol)) {
    console.log('Invalid protocol, please use one of the following: ', ProtocolNames)
    return
  }
  if (!isDecodingMode(mode)) {
    console.log('Invalid decoding mode, please use one of the following: ', DecodingModes)
    return
  }

  const operationName = getRefinanceOperationName(fromProtocol, toProtocol)

  console.log('==============================')
  console.log('Operation: ', operationName)
  console.log('==============================')

  const operationDefinition = getRefinanceOperationDefinition(fromProtocol, toProtocol)
  if (!operationDefinition) {
    console.log('No definition found!')
    return
  }

  if (mode === 'paths') {
    console.log('Name: ', operationDefinition.name)
    console.log('Actions: ', JSON.stringify(operationDefinition.actions, null, 2))
  } else {
    const decodedDefinition = decodeOperationDefinitionPaths(network, operationDefinition)
    if (!decodedDefinition) {
      console.log('The definition could not be decoded!')
      return
    }

    console.log('Name: ', decodedDefinition.name)
    console.log('Actions: ', JSON.stringify(decodedDefinition.actions, null, 2))
  }
}

task('refinance-get-definition', 'Gets the definition of a refinance operation')
  .addParam('fromProtocol', 'The protocol that the refinance is closing from')
  .addParam('toProtocol', 'The protocol that the refinance is opening to')
  .addParam('mode', 'Mode of decoding of the operation definition: [paths, hashes]', 'paths')
  .setAction(async (taskArgs, hre) => {
    const { name: network } = hre.network
    const { ethers } = hre

    // Disable the annoying duplicated definition warning
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    getOperationDefinition(
      network as Network,
      taskArgs.fromProtocol,
      taskArgs.toProtocol,
      taskArgs.mode,
    )
  })
