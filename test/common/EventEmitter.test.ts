import { CONTRACT_NAMES, OPERATION_NAMES } from '@oasisdex/oasis-actions'
import { expect } from 'chai'
import hre from 'hardhat'

import { createDeploy } from '../../helpers/deploy'
import init from '../../helpers/init'
import { ServiceRegistry } from '../../helpers/serviceRegistry'
import { OperationsRegistry } from '../../helpers/wrappers/operationsRegistry'
import { expectRevert } from '../utils'

const ethers = hre.ethers

describe('EventEmitter', () => {
  it('should emit Operation and Action events with correct values emitted', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const expectedEmittedReturnVal = 123
    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    const registry = new ServiceRegistry(serviceRegistryAddress, config.signer)
    const [operationExecutor, operationExecutorAddress] = await deploy('OperationExecutor', [
      serviceRegistryAddress,
    ])
    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])
    const [, eventEmitterTestActionAddress] = await deploy(
      CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION,
      [serviceRegistryAddress],
    )

    const [, eventEmitterAddress] = await deploy('EventEmitter', [serviceRegistryAddress])
    const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])
    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
    await registry.addEntry(
      CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION,
      eventEmitterTestActionAddress,
    )
    await registry.addEntry(CONTRACT_NAMES.common.EVENT_EMITTER, eventEmitterAddress)

    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      operationsRegistryAddress,
      config.signer,
    )
    await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

    // Act
    const actionHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION),
    )
    const types = [`tuple(bool breakEvents)`]
    const args = [
      {
        breakEvents: false,
      },
    ]

    const iface = new ethers.utils.Interface([
      ' function execute(bytes calldata data, uint8[] paramsMap) external payable returns (bytes calldata)',
    ])

    const encodedArgs = ethers.utils.defaultAbiCoder.encode(
      types[0] ? [types[0]] : [],
      args[0] ? [args[0]] : [],
    )
    const calldata = iface.encodeFunctionData('execute', [encodedArgs, args[1] ? args[1] : []])
    const calls = [
      {
        targetHash: actionHash,
        callData: calldata,
      },
    ]

    const tx = operationExecutor.executeOp(calls, OPERATION_NAMES.common.CUSTOM_OPERATION, {
      gasLimit: 4000000,
    })

    const receipt = await tx
    const result = await receipt.wait()

    const actionEventData = result.logs[0].data
    const actionEventTopics = result.logs[0].topics
    const emittedActionEventName = actionEventTopics[1]

    const abiCoder = new ethers.utils.AbiCoder()
    const [actualEmittedProxyAddress, actualEmittedEncodedActionData] = abiCoder.decode(
      ['address', 'bytes'],
      actionEventData,
    )
    const [actualEmittedReturnVal] = abiCoder.decode(['uint256'], actualEmittedEncodedActionData)

    expect(emittedActionEventName).to.equal(
      ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION),
      ),
    )

    // We use operationExecutor as the expected value because we're calling OpExec directly here
    expect(actualEmittedProxyAddress).to.equal(operationExecutorAddress)
    expect(actualEmittedReturnVal).to.equal(expectedEmittedReturnVal)
  })
  it('should not emit when OpStorage proxy address is different', async () => {
    // Arrange
    const config = await init()
    const deploy = await createDeploy({ config }, hre)
    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    const registry = new ServiceRegistry(serviceRegistryAddress, config.signer)
    const [operationExecutor, operationExecutorAddress] = await deploy('OperationExecutor', [
      serviceRegistryAddress,
    ])
    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistryAddress,
      operationExecutorAddress,
    ])
    const [, eventEmitterTestActionAddress] = await deploy(
      CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION,
      [serviceRegistryAddress],
    )
    const [, operationsRegistryAddress] = await deploy('OperationsRegistry', [])
    const [, eventEmitterAddress] = await deploy('EventEmitter', [serviceRegistryAddress])

    await registry.addEntry(CONTRACT_NAMES.common.OPERATION_STORAGE, operationStorageAddress)
    await registry.addEntry(CONTRACT_NAMES.common.OPERATIONS_REGISTRY, operationsRegistryAddress)
    await registry.addEntry(
      CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION,
      eventEmitterTestActionAddress,
    )
    await registry.addEntry(CONTRACT_NAMES.common.EVENT_EMITTER, eventEmitterAddress)

    const operationsRegistry: OperationsRegistry = new OperationsRegistry(
      operationsRegistryAddress,
      config.signer,
    )
    await operationsRegistry.addOp(OPERATION_NAMES.common.CUSTOM_OPERATION, [])

    const actionHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(CONTRACT_NAMES.test.EVENT_EMITTER_TEST_ACTION),
    )
    const types = [`tuple(bool breakEvents)`]
    const args = [
      {
        breakEvents: true,
      },
    ]

    const iface = new ethers.utils.Interface([
      ' function execute(bytes calldata data, uint8[] paramsMap) external payable returns (bytes calldata)',
    ])

    const encodedArgs = ethers.utils.defaultAbiCoder.encode(
      types[0] ? [types[0]] : [],
      args[0] ? [args[0]] : [],
    )
    const calldata = iface.encodeFunctionData('execute', [encodedArgs, args[1] ? args[1] : []])
    const calls = [
      {
        targetHash: actionHash,
        callData: calldata,
      },
    ]

    const tx = operationExecutor.executeOp(calls, 'CustomOperation', {
      gasLimit: 4000000,
    })

    await expectRevert(/proxy address and stored proxy address do not match/, tx)
  })
})
