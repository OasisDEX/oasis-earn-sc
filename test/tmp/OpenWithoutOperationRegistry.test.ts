import { createDeploy, DeployFunction, executeThroughProxy } from '@helpers/deploy'
import init from '@helpers/init'
import { getOrCreateProxy } from '@helpers/proxy'
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { RuntimeConfig } from '@helpers/types/common'
import { OperationsRegistry } from '@helpers/wrappers/operationsRegistry'
import { ActionCall, ActionFactory } from '@oasisdex/oasis-actions'
import { calculateOperationHash } from '@oasisdex/oasis-actions/src/operations/helpers'
import { FlashloanProvider } from '@oasisdex/oasis-actions/src/types/common'
import BigNumber from 'bignumber.js'
import { Signer } from 'ethers'
import hre from 'hardhat'

import * as actions from '../../packages/oasis-actions/src/actions'
import { getServiceNameHash } from '../../scripts/common'
const ethers = hre.ethers
const createAction = ActionFactory.create

describe.only('OperationExecutor', async function () {
  let config: RuntimeConfig
  let signer: Signer
  let proxyAddress: string
  let deploy: DeployFunction
  let serviceRegistry: ServiceRegistry
  let dummyAction: ActionCall

  before(async () => {
    config = await init()
    signer = config.signer
    proxyAddress = (
      await getOrCreateProxy(
        await ethers.getContractAt('DSProxyRegistry', '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'),
        signer,
      )
    ).address

    deploy = await createDeploy({ config, debug: true })

    dummyAction = createAction(
      getServiceNameHash('DummyAction'),
      ['tuple(address to)', 'uint8[] paramsMap'],
      [
        {
          to: proxyAddress,
        },
        [0],
      ],
    )
  })

  beforeEach(async () => {
    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    serviceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)

    const [, dummyActionAddress] = await deploy('DummyAction', [serviceRegistryAddress])
    await serviceRegistry.addEntry('DummyAction', dummyActionAddress)
  })

  it('should execute operation without externally stored operation hash', async () => {
    hre.tracer.enabled = false
    const [operationExecutor] = await deploy('OperationExecutorHotHash', [serviceRegistry.address])
    const [, operationStorageAddress] = await deploy('OperationStorageHotHash', [
      serviceRegistry.address,
      operationExecutor.address,
    ])

    await serviceRegistry.addEntry('OperationStorage_2', operationStorageAddress)

    const calls = [
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
    ]

    const takeAFlashLoan = actions.common.takeAFlashLoan({
      flashloanAmount: new BigNumber(10000),
      asset: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      isProxyFlashloan: true,
      isDPMProxy: true,
      provider: FlashloanProvider.DssFlash,
      calls,
    })

    hre.tracer.enabled = true
    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
          takeAFlashLoan,
          calculateOperationHash([takeAFlashLoan, ...calls]),
        ]),
      },
      signer,
      '10',
      hre,
    )
    hre.tracer.enabled = false
  })

  it('should execute operation with externally stored operation hash', async () => {
    const [operationExecutor] = await deploy('OperationExecutorColdHash', [serviceRegistry.address])
    const [operationStorage] = await deploy('OperationStorageColdHash', [
      serviceRegistry.address,
      operationExecutor.address,
    ])
    const [operationsRegistry] = await deploy('OperationsRegistryColdHash')

    const calls = [
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
    ]

    await serviceRegistry.addEntry('OperationStorage_2', operationStorage.address)
    await serviceRegistry.addEntry('OperationsRegistry_2', operationsRegistry.address)
    await operationsRegistry.addOperation(calculateOperationHash(calls))

    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls]),
      },
      signer,
      '10',
      hre,
    )
  })
  it.only('should execute operation with externally stored operation hash - calldata', async () => {
    const [operationExecutor] = await deploy('OperationExecutorColdHashCalldata', [
      serviceRegistry.address,
    ])
    const [operationStorage] = await deploy('OperationStorageColdHash', [
      serviceRegistry.address,
      operationExecutor.address,
    ])
    const [operationsRegistry] = await deploy('OperationsRegistryColdHash')

    const calls = [
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
      dummyAction,
    ]

    await serviceRegistry.addEntry('OperationStorage_2', operationStorage.address)
    await serviceRegistry.addEntry('OperationsRegistry_2', operationsRegistry.address)
    await operationsRegistry.addOperation(calculateOperationHash(calls))

    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls]),
      },
      signer,
      '10',
      hre,
    )
  })
  it('should execute operation with externally stored operation', async () => {
    const [operationExecutor] = await deploy('OperationExecutor', [serviceRegistry.address])
    const [operationStorage] = await deploy('OperationStorage', [
      serviceRegistry.address,
      operationExecutor.address,
    ])
    const [opsRegistry] = await deploy('OperationsRegistry')

    await serviceRegistry.addEntry('OperationStorage_2', operationStorage.address)
    await serviceRegistry.addEntry('OperationsRegistry_2', opsRegistry.address)

    const skippedOne = { ...dummyAction }
    skippedOne.skipped = true
    const skippedTwo = { ...dummyAction }
    skippedTwo.skipped = true
    const skippedThree = { ...dummyAction }
    skippedTwo.skipped = true

    const calls = [
      dummyAction,
      dummyAction,
      dummyAction,
      skippedOne,
      dummyAction,
      dummyAction,
      dummyAction,
      skippedTwo,
      dummyAction,
      dummyAction,
      dummyAction,
      skippedThree,
    ]

    const operationsRegistry = new OperationsRegistry(opsRegistry.address, signer)

    await operationsRegistry.addOp(
      'DummyOperation',
      calls.map(call => {
        return {
          hash: call.targetHash,
          optional: call.skipped,
        }
      }),
    )

    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
          calls,
          'DummyOperation',
        ]),
      },
      signer,
      '10',
      hre,
    )
  })
})
