// How to do this?

// Setup the system as normal
// Except we want to use a homemade ERC20 with a compromised transferFrom

// Probably easiest to:
// Follow borrow-v3.test.ts
// Add fake operations with dummy actions
// Operation would be...
// 1. Take a flashloan
// 2. SendToken
// 3. Unsafe ERC20 triggers malicious attack via transfer hook
// 4. Triggers re-entrant flashloan via flashloan action
// 5. SendToken sends tokens to attacker via malicous send.to param

import { smock } from '@defi-wonderland/smock'
import { CONTRACT_NAMES } from '@deploy-configurations/constants'
import { getActionHash } from '@deploy-configurations/utils/action-hash/index'
import { OperationsRegistry, ServiceRegistry } from '@deploy-configurations/utils/wrappers'
import { ONE } from '@dma-common/constants'
import { createDPMAccount, expect } from '@dma-common/test-utils'
import { createDeploy } from '@dma-common/utils/deploy'
import { executeThroughDPMProxy } from '@dma-common/utils/execute/index'
import init from '@dma-common/utils/init'
import { JsonRpcProvider } from '@ethersproject/providers'
import chai from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const utils = ethers.utils
chai.use(smock.matchers)

describe('Re-entrant Balancer FL Attack', () => {
  let provider: JsonRpcProvider
  let contracts:
    | {
        testDpmProxy: Contract
        maliciousToken: Contract
        operationExecutor: Contract
        flashloanAction: Contract
        sendTokenAction: Contract
      }
    | undefined
  let snapshotId: string
  const operationName = 'attackOp'

  before(async () => {
    const config = await init()
    provider = config.provider
    const signer = config.signer

    const deploy = await createDeploy({ config })
    const delay = 0

    // Create Proxy for test
    const ACCOUNT_FACTORY_ADDRESS = '0xF7B75183A2829843dB06266c114297dfbFaeE2b6'
    const accountFactoryInstance = await ethers.getContractAt(
      'AccountFactory',
      ACCOUNT_FACTORY_ADDRESS,
    )
    const [testDpmProxy] = await createDPMAccount(accountFactoryInstance)

    // Deploy malicious ERC20
    const [maliciousToken, maliciousTokenAddress] = await deploy('MaliciousERC20', [])

    // Deploy Contracts
    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [delay])
    const [operationExecutor, operationExecutorAddress] = await deploy('OperationExecutor', [
      serviceRegistryAddress,
    ])
    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])
    const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])

    // Deploy Actions
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    const DS_GUARD_FACTORY = '0x5a15566417e6C1c9546523066500bDDBc53F88C7'
    const [flashloanAction, flashloanActionAddress] = await deploy('TakeFlashloan', [
      serviceRegistryAddress,
      DAI_ADDRESS,
      DS_GUARD_FACTORY,
    ])
    const [sendTokenAction, sendTokenActionAddress] = await deploy('SendToken', [
      serviceRegistryAddress,
    ])

    // Add Entries to Service Registry
    const BALANCER_VAULT_ADDRESS = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
    const registry = new ServiceRegistry(serviceRegistryAddress, signer)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_EXECUTOR, operationExecutorAddress)
    await registry.addEntry(CONTRACT_NAMES.common.BALANCER_VAULT, BALANCER_VAULT_ADDRESS)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
    await registry.addEntry(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN, flashloanActionAddress)
    await registry.addEntry(CONTRACT_NAMES.common.SEND_TOKEN, sendTokenActionAddress)

    // Add Entries to Operations Registry
    const operationsRegistry = new OperationsRegistry(operationsRegistryAddress, signer)

    const testOpDefinition = {
      name: operationName,
      actions: [
        {
          hash: getActionHash(CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
          optional: false,
        },
        {
          hash: getActionHash(CONTRACT_NAMES.common.SEND_TOKEN),
          optional: true,
        },
      ],
    }
    await operationsRegistry.addOp(testOpDefinition.name, testOpDefinition.actions)

    // Expose contracts
    contracts = {
      testDpmProxy,
      maliciousToken,
      operationExecutor,
      flashloanAction,
      sendTokenAction,
    }
  })

  it('should revert with no Reentrant loan not allowed message', async () => {
    const calls = []
    const ethAmtToSteal = ONE
    const calldata = await encodeOperation(contracts!.operationExecutor, calls, operationName)
    const status = await executeOperation(
      contracts!.testDpmProxy.address,
      contracts!.operationExecutor.address,
      calldata,
      contracts!.testDpmProxy.signer,
      ethAmtToSteal,
    )

    expect(status).to.be.false
  })
})

async function encodeOperation(operationExecutor: Contract, calls, operationName) {
  return operationExecutor.interface.encodeFunctionData('executeOp', [calls, operationName])
}

async function executeOperation(
  dpmProxyAddress: string,
  operationExecutorAddress: string,
  calldata,
  signer,
  ethAmtToSteal,
) {
  const [status] = await executeThroughDPMProxy(
    dpmProxyAddress,
    {
      address: operationExecutorAddress,
      calldata,
    },
    signer,
    ethAmtToSteal.toString(),
  )

  return status
}
