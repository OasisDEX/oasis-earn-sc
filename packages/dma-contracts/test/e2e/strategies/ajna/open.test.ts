import { prepareEnv } from '@ajna-contracts/scripts'
import init from '@dma-common/utils/init'
import { getServiceNameHash } from '@dma-contracts/../dma-common/utils/common'
import { createDeploy, DeployFunction } from '@dma-contracts/../dma-common/utils/deploy'
import { executeThroughProxy } from '@dma-contracts/../dma-common/utils/execute'
import { getOrCreateProxy } from '@dma-contracts/../dma-common/utils/proxy'
import { Network } from '@dma-contracts/../dma-deployments/types/network'
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

describe.only('Strategy | AJNA | Open | E2E', () => {
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
    env = await prepareEnv(hre, true)

    signer = config.signer
    deploy = await createDeploy({ config, debug: true })

    proxyAddress = (
      await getOrCreateProxy(
        await ethers.getContractAt('DSProxyRegistry', '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'),
        env.borrower,
      )
    ).address

    const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
    serviceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)

    await addAcctions(deploy, serviceRegistryAddress, env, serviceRegistry)

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

    const ajnaMultiplyOperation = {
      actions: [
        getServiceNameHash('TakeFlashloan_3'),
        getServiceNameHash('PullToken_3'),
        getServiceNameHash('WrapEth_3'),
        getServiceNameHash('SwapAction_3'),
        getServiceNameHash('SetApproval_3'),
        getServiceNameHash('AjnaDepositBorrow'),
        getServiceNameHash('PositionCreated'),
      ],
      optional: [false, false, true, false, false, false, false],
      name: 'AjnaOpenMultiply',
    } as StoredOperationStruct

    const ajnaOpenBorrow = {
      actions: [
        getServiceNameHash('PullToken_3'),
        getServiceNameHash('SetApproval_3'),
        getServiceNameHash('AjnaDepositBorrow'),
      ],
      optional: [false, false, false, false],
      name: 'AjnaOpenBorrow',
    } as StoredOperationStruct

    const operationRegistry = (await deploy('OperationsRegistry', []))[0] as OperationsRegistry
    await operationRegistry.addOperation(operation)
    await operationRegistry.addOperation(ajnaMultiplyOperation)
    await operationRegistry.addOperation(ajnaOpenBorrow)
    await serviceRegistry.addEntry('OperationStorage_2', operationStorageAddress)
    await serviceRegistry.addEntry('OperationsRegistry_2', operationRegistry.address)
  })

  beforeEach(async () => {
    snapshotId = await provider.send('evm_snapshot', [])
  })

  afterEach(async () => {
    await provider.send('evm_revert', [snapshotId])
  })

  it('should work - ajna open borrow', async () => {
    const calls = [
      createAction(
        getServiceNameHash('PullToken_3'),
        ['tuple(address asset, address from, uint256 amount)', 'uint8[] paramsMap'],
        [
          {
            from: await signer.getAddress(),
            asset: ADDRESSES[Network.MAINNET].common.WBTC,
            amount: '100000000',
          },
          [0, 0, 0],
        ],
      ),
      createAction(
        getServiceNameHash('SetApproval_3'),
        [
          'tuple(address asset, address delegate, uint256 amount, bool sumAmounts)',
          'uint8[] paramsMap',
        ],
        [
          {
            asset: ADDRESSES[Network.MAINNET].common.WBTC,
            delegate: env.poolContract.address,
            amount: '1000000000000000000',
            sumAmounts: false,
          },
          [0, 0, 0],
        ],
      ),
      createAction(
        getServiceNameHash('AjnaOpenBorrow'),
        [
          'tuple(address pool, uint256 depositAmount, uint256 borrowAmount, bool sumDepositAmounts, uint256 price)',
          'uint8[] paramsMap',
        ],
        [
          {
            pool: env.poolContract.address,
            depositAmount: '1000000000000000000',
            borrowAmount: '1000000000000000000',
            sumDepositAmounts: false,
            price: '1000000000000000000',
          },
          [0, 0, 0],
        ],
      ),
    ]
    await env.wbtc.connect(env.borrower).approve(env.poolContract.address, '1000000000000000000')
    const opName = 'AjnaOpenBorrow'
    await executeThroughProxy(
      proxyAddress,
      {
        address: operationExecutor.address,
        calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls, opName]),
      },
      env.borrower,
      '10',
      hre,
    )

    expect(true).to.be.eq(true)
  })
})
async function addAcctions(
  deploy: DeployFunction,
  serviceRegistryAddress: string,
  env: any,
  serviceRegistry: ServiceRegistry,
) {
  const [, dummyActionAddress] = await deploy('DummyAction', [serviceRegistryAddress])
  const ajnaDepositBorrow = await deploy('AjnaDepositBorrow', [
    env.poolInfo.address,
    serviceRegistryAddress,
  ])
  const ajnaRepayWithdraw = await deploy('AjnaRepayWithdraw', [
    env.poolInfo.address,
    serviceRegistryAddress,
  ])
  const takeFlashloan = await deploy('TakeFlashloan_3', [
    serviceRegistryAddress,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
  ])
  const wrapEth = await deploy('WrapEth', [serviceRegistryAddress])
  const swapAction = await deploy('SwapAction_3', [serviceRegistryAddress])
  const positionCreated = await deploy('PositionCreated', [])
  const pullToken = await deploy('PullToken', [])
  const setApproval = await deploy('SetApproval', [serviceRegistryAddress])

  await serviceRegistry.addEntry('DummyAction', dummyActionAddress)
  await serviceRegistry.addEntry('AjnaDepositBorrow', ajnaDepositBorrow[1])
  await serviceRegistry.addEntry('AjnaRepayWithdraw', ajnaRepayWithdraw[1])
  await serviceRegistry.addEntry('PullToken_3', pullToken[1])
  await serviceRegistry.addEntry('SetApproval_3', setApproval[1])
  await serviceRegistry.addEntry('TakeFlashloan_3', takeFlashloan[1])
  await serviceRegistry.addEntry('WrapEth_3', wrapEth[1])
  await serviceRegistry.addEntry('Swap', swapAction[1])
  await serviceRegistry.addEntry('PositionCreated', positionCreated[1])
}
