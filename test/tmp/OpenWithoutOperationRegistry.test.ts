import { DeployFunction, executeThroughProxy } from '@helpers/deploy'
import { createDeploy } from '@helpers/deploy'
import init from '@helpers/init'
import { getOrCreateProxy } from '@helpers/proxy'
import { ServiceRegistry } from '@helpers/serviceRegistry'
import { ActionCall, ActionFactory, TEN_THOUSAND } from '@oasisdex/oasis-actions'
import hre from 'hardhat'
import { calculateOperationHash } from '@oasisdex/oasis-actions/src/operations/helpers'
import { OperationsRegistry } from '@helpers/wrappers/operationsRegistry'
import { RuntimeConfig } from '@helpers/types/common'
import { Signer } from 'ethers'
import { getServiceNameHash } from '../../scripts/common'
import * as actions from '../../packages/oasis-actions/src/actions'
import { FlashloanProvider } from '@oasisdex/oasis-actions/src/types/common'

const ethers = hre.ethers
const createAction = ActionFactory.create

describe('OperationExecutor', async function () {
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

    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
          calls,
          calculateOperationHash(calls),
        ]),
      },
      signer,
      '10',
      hre,
    )
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

  it.only('should execute operation with local storage', async () => {
    const [operationExecutor] = await deploy('OperationExecutorStorageSlot', [
      serviceRegistry.address,
    ])
    const [operationStorage] = await deploy('OperationStorageColdHash', [
      serviceRegistry.address,
      operationExecutor.address,
    ])
    const [takeAFlashloanAction] = await deploy('TakeFlashloan', [
      serviceRegistry.address,
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
    ])
    const [sendTokenAction] = await deploy('SendToken', [serviceRegistry.address])
    const [chainLogView] = await deploy('ChainLogView', [
      '0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F',
    ])
    const [operationsRegistry] = await deploy('OperationsRegistryColdHash')
    await serviceRegistry.addEntry('OperationExecutor_2', operationExecutor.address)
    await serviceRegistry.addEntry('OperationsRegistry_2', operationsRegistry.address)
    await serviceRegistry.addEntry('OperationStorage_2', operationStorage.address)
    await serviceRegistry.addEntry(
      'McdFlashMintModule',
      '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
    )
    await serviceRegistry.addEntry('ChainLogView', chainLogView.address)
    await serviceRegistry.addEntry('TakeFlashloan_3', takeAFlashloanAction.address)
    await serviceRegistry.addEntry('SendToken_4', sendTokenAction.address)

    const sendToken = actions.common.sendToken({
      asset: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      amount: TEN_THOUSAND,
      to: operationExecutor.address,
    })

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
      sendToken,
    ]

    const takeAFlashLoan = actions.common.takeAFlashLoan({
      flashloanAmount: TEN_THOUSAND,
      asset: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      isProxyFlashloan: true,
      isDPMProxy: false,
      provider: FlashloanProvider.DssFlash,
      calls,
    })

    await operationsRegistry.addOperation(
      calculateOperationHash([dummyAction, takeAFlashLoan, ...calls]),
    )

    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [
          [dummyAction, takeAFlashLoan],
        ]),
      },
      signer,
      '10',
      hre,
    )
  })
})
