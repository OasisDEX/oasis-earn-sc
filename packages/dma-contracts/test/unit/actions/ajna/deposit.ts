import { deployPool, prepareEnv } from '@ajna-contracts/scripts'
import init from '@dma-common/utils/init'
import { getServiceNameHash } from '@dma-contracts/../dma-common/utils/common'
import { createDeploy, DeployFunction } from '@dma-contracts/../dma-common/utils/deploy'
import { executeThroughProxy } from '@dma-contracts/../dma-common/utils/execute'
import { getOrCreateProxy } from '@dma-contracts/../dma-common/utils/proxy'
import { ServiceRegistry } from '@dma-contracts/../dma-deployments/utils/wrappers'
import { ADDRESSES } from '@dma-deployments/addresses'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ActionFactory } from '@oasisdex/oasis-actions'
import { StoredOperationStruct } from '@typechain/dma-contracts/artifacts/contracts/core/OperationsRegistry'
import { OperationsRegistry } from '@typechain/index'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const ethers = hre.ethers
const createAction = ActionFactory.create

describe.only('AJNA | POC | Unit', () => {
  let provider: JsonRpcProvider
  let snapshotId: string
  let hre: HardhatRuntimeEnvironment
  let env
  let proxyAddress: string
  let deploy: DeployFunction
  let serviceRegistry: ServiceRegistry
  let signer: Signer
  let operationExecutor: Contract

  before(async () => {
    const config = await init()
    hre = (config as any).hre
    provider = config.provider
    env = await prepareEnv(hre)

    signer = config.signer
    deploy = await createDeploy({ config, debug: true })

    proxyAddress = (
      await getOrCreateProxy(
        await ethers.getContractAt('DSProxyRegistry', '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'),
        signer,
      )
    ).address

    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    serviceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)

    const [, dummyActionAddress] = await deploy('DummyAction', [serviceRegistryAddress])

    const ajnaDepositBorrow = await deploy('AjnaDepositBorrow', [
      env.poolInfo.address,
      serviceRegistryAddress,
    ])

    const ajnaRepayWithdraw = await deploy('AjnaRepayWithdraw', [
      env.poolInfo.address,
      serviceRegistryAddress,
    ])

    await serviceRegistry.addEntry('DummyAction', dummyActionAddress)
    await serviceRegistry.addEntry('AjnaDepositBorrow', ajnaDepositBorrow[1])
    await serviceRegistry.addEntry('AjnaRepayWithdraw', ajnaRepayWithdraw[1])

    operationExecutor = (await deploy('OperationExecutor', [serviceRegistry.address]))[0]

    const [, operationStorageAddress] = await deploy('OperationStorage', [
      serviceRegistry.address,
      operationExecutor.address,
    ])

    const operation = {
      actions: [getServiceNameHash('DummyAction')],
      optional: [false],
      name: 'DUMMY_NAME',
    } as StoredOperationStruct

    const operationRegistry = (await deploy('OperationsRegistry', []))[0] as OperationsRegistry
    await operationRegistry.addOperation(operation)
    await serviceRegistry.addEntry('OperationStorage_2', operationStorageAddress)
    await serviceRegistry.addEntry('OperationsRegistry_2', operationRegistry.address)
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should work', async () => {
    await deployPool(
      env.erc20PoolFactory,
      ADDRESSES.mainnet.common.WETH,
      ADDRESSES.mainnet.common.USDC,
    )
    const calls = [
      createAction(
        getServiceNameHash('DummyAction'),
        ['tuple(address to)', 'uint8[] paramsMap'],
        [
          {
            to: proxyAddress,
          },
          [0],
        ],
      ),
    ]

    const opName = 'DUMMY_NAME'
    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls, opName]),
      },
      signer,
      '10',
      hre,
    )

    expect(true).to.be.eq(true)
  })
})
