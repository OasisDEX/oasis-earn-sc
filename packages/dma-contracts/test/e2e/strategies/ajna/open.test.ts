import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { EnvWithAjnaPositions } from '@dma-contracts/test/fixtures'
import {
  envWithAjnaPositions,
  getSupportedAjnaPositions,
} from '@dma-contracts/test/fixtures/env/env-with-ajna-positions'
import { ISimulatedTransition } from '@dma-library'
import { IPosition } from '@domain'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import BigNumber from 'bignumber.js'
import hre from 'hardhat'

const ethers = hre.ethers

const networkFork = process.env.NETWORK_FORK as Network
const EXPECT_LARGER_SIMULATED_FEE = 'Expect simulated fee to be more than the user actual pays'

describe.only('Strategy | AJNA | Open Multiply | E2E', () => {
  // let provider: JsonRpcProvider
  // let snapshotId: string
  // let hre: HardhatRuntimeEnvironment
  // let env
  // let proxyAddress: string
  // let deploy: DeployFunction
  // let serviceRegistry: ServiceRegistry
  // let signer: Signer
  // let operationExecutor: Contract

  // before(async () => {
  //   const config = await init()
  //   hre = (config as any).hre
  //   provider = config.provider
  //   env = await prepareEnv(hre, true)
  //
  //   signer = config.signer
  //   deploy = await createDeploy({ config, debug: true })
  //
  //   proxyAddress = (
  //     await getOrCreateProxy(
  //       await ethers.getContractAt('DSProxyRegistry', '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'),
  //       env.borrower,
  //     )
  //   ).address
  //
  //   const [, serviceRegistryAddress] = await deploy('ServiceRegistry', [0])
  //   serviceRegistry = new ServiceRegistry(serviceRegistryAddress, signer)
  //
  //   await addAcctions(deploy, serviceRegistryAddress, env, serviceRegistry)
  //
  //   operationExecutor = (await deploy('OperationExecutor', [serviceRegistry.address]))[0]
  //
  //   const [, operationStorageAddress] = await deploy('OperationStorage', [
  //     serviceRegistry.address,
  //     operationExecutor.address,
  //   ])
  //
  //   const operation = {
  //     actions: [getServiceNameHash('DummyAction')],
  //     optional: [false],
  //     name: 'DUMMY_NAME',
  //   } as StoredOperationStruct
  //
  //   const ajnaMultiplyOperation = {
  //     actions: [
  //       getServiceNameHash('TakeFlashloan_3'),
  //       getServiceNameHash('PullToken_3'),
  //       getServiceNameHash('WrapEth_3'),
  //       getServiceNameHash('SwapAction_3'),
  //       getServiceNameHash('SetApproval_3'),
  //       getServiceNameHash('AjnaDepositBorrow'),
  //       getServiceNameHash('PositionCreated'),
  //     ],
  //     optional: [false, false, true, false, false, false, false],
  //     name: 'AjnaOpenMultiply',
  //   } as StoredOperationStruct
  //
  //   const ajnaOpenBorrow = {
  //     actions: [
  //       getServiceNameHash('PullToken_3'),
  //       getServiceNameHash('SetApproval_3'),
  //       getServiceNameHash('AjnaDepositBorrow'),
  //     ],
  //     optional: [false, false, false, false],
  //     name: 'AjnaOpenBorrow',
  //   } as StoredOperationStruct
  //
  //   const operationRegistry = (await deploy('OperationsRegistry', []))[0] as OperationsRegistry
  //   await operationRegistry.addOperation(operation)
  //   await operationRegistry.addOperation(ajnaMultiplyOperation)
  //   await operationRegistry.addOperation(ajnaOpenBorrow)
  //   await serviceRegistry.addEntry('OperationStorage_2', operationStorageAddress)
  //   await serviceRegistry.addEntry('OperationsRegistry_2', operationRegistry.address)
  // })
  //
  // beforeEach(async () => {
  //   snapshotId = await provider.send('evm_snapshot', [])
  // })
  //
  // afterEach(async () => {
  //   await provider.send('evm_revert', [snapshotId])
  // })

  const supportedPositions = getSupportedAjnaPositions(networkFork)
  let env: EnvWithAjnaPositions
  const fixture = envWithAjnaPositions({
    network: networkFork,
    systemConfigPath: `test/${networkFork}.conf.ts`,
    configExtensionPaths: [`test/uSwap.conf.ts`],
  })
  before(async function () {
    env = await loadFixture(fixture)
  })

  describe('Open multiply positions', function () {
    // const insufficientLiquidityStrategies = ['WSTETH/ETH Earn']
    supportedPositions
      // .filter(({ name }) => !insufficientLiquidityStrategies.includes(name))
      .forEach(({ name: variant }) => {
        let position: IPosition
        let simulatedPosition: IPosition
        let simulatedTransition: ISimulatedTransition
        let feeWalletBalanceChange: BigNumber

        before(async function () {
          const { positions } = env
          const positionDetails = positions[variant]
          if (!positionDetails) {
            throw new Error('Position not found')
          }
          position = await positionDetails.getPosition()
          simulatedPosition = positionDetails.__openPositionSimulation.position
          simulatedTransition = positionDetails.__openPositionSimulation
          feeWalletBalanceChange = positionDetails.__feeWalletBalanceChange
        })

        it(`Should draw the correct amount of debt for ${variant}`, async () => {
          expect.toBe(
            simulatedPosition.debt.amount.toFixed(0),
            'lte',
            position.debt.amount.toFixed(0),
          )
        })
        it(`Should deposit all collateral for ${variant}`, async () => {
          expect.toBe(
            simulatedPosition.collateral.amount,
            'lte',
            position.collateral.amount.toFixed(0),
          )
        })
        it(`Should have the correct multiple for ${variant}`, async () => {
          expect.toBe(position.riskRatio.multiple, 'lte', simulatedPosition.riskRatio.multiple)
        })
        it(`Should collect fee for ${variant}`, async () => {
          expect.toBe(
            simulatedTransition.swap.tokenFee,
            'gte',
            feeWalletBalanceChange,
            EXPECT_LARGER_SIMULATED_FEE,
          )
        })
      })
  })

  // it('should work - ajna open borrow', async () => {
  //   strategies.ajna
  //   const calls = [
  //     createAction(
  //       getServiceNameHash('PullToken_3'),
  //       ['tuple(address asset, address from, uint256 amount)', 'uint8[] paramsMap'],
  //       [
  //         {
  //           from: await signer.getAddress(),
  //           asset: ADDRESSES[Network.MAINNET].common.WBTC,
  //           amount: '100000000',
  //         },
  //         [0, 0, 0],
  //       ],
  //     ),
  //     createAction(
  //       getServiceNameHash('SetApproval_3'),
  //       [
  //         'tuple(address asset, address delegate, uint256 amount, bool sumAmounts)',
  //         'uint8[] paramsMap',
  //       ],
  //       [
  //         {
  //           asset: ADDRESSES[Network.MAINNET].common.WBTC,
  //           delegate: env.poolContract.address,
  //           amount: '1000000000000000000',
  //           sumAmounts: false,
  //         },
  //         [0, 0, 0],
  //       ],
  //     ),
  //     createAction(
  //       getServiceNameHash('AjnaOpenBorrow'),
  //       [
  //         'tuple(address pool, uint256 depositAmount, uint256 borrowAmount, bool sumDepositAmounts, uint256 price)',
  //         'uint8[] paramsMap',
  //       ],
  //       [
  //         {
  //           pool: env.poolContract.address,
  //           depositAmount: '1000000000000000000',
  //           borrowAmount: '1000000000000000000',
  //           sumDepositAmounts: false,
  //           price: '1000000000000000000',
  //         },
  //         [0, 0, 0],
  //       ],
  //     ),
  //   ]
  //   await env.wbtc.connect(env.borrower).approve(env.poolContract.address, '1000000000000000000')
  //   const opName = 'AjnaOpenBorrow'
  //   const tx = await executeThroughProxy(
  //     proxyAddress,
  //     {
  //       address: operationExecutor.address,
  //       calldata: operationExecutor.interface.encodeFunctionData('executeOp', [calls, opName]),
  //     },
  //     env.borrower,
  //     '10',
  //     hre,
  //   )
  //
  //   console.log(tx)
  //   expect(true).to.be.eq(true)
  // })
})
